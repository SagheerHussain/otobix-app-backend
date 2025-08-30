// controllers/upcoming_controller.js
const mongoose = require('mongoose');
const Car = require('../Models/carModel');
const SocketService = require('../Config/socket_service');
const EVENTS = require('../Sockets/socket_events');
const CONSTANTS = require('../Utils/constants');
const CarDetailsForCarsListModel = require('../Shared/car_details_for_cars_list_model');
const Agenda2 = require('../Agenda/agenda2');


// import the scheduler helper from your job file
const { scheduleMoveCarFromUpcomingToLive } =
    require('../Agenda/Agenda Jobs/move_car_from_upcoming_to_live_job');

function safeDate(v) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

exports.updateCarAuctionTime = async (req, res) => {
    try {
        const { carId, auctionStartTime, auctionEndTime, auctionDuration, auctionMode } = req.body;

        if (!carId || !mongoose.isValidObjectId(carId)) {
            return res.status(400).json({ ok: false, message: 'Invalid carId' });
        }

        const durationHrs = Number(auctionDuration);
        if (!Number.isFinite(durationHrs) || durationHrs <= 0) {
            return res.status(400).json({ ok: false, message: 'Invalid auctionDuration' });
        }


        const start = safeDate(auctionStartTime);
        const end = safeDate(auctionEndTime);

        if (!start || !end) {
            return res.status(400).json({ ok: false, message: 'Invalid start/end time' });
        }

        const now = new Date();

        // Fetch car (for status checks & socket payload later)
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ ok: false, message: 'Car not found' });
        }

        // Get agenda instance (store it in app at bootstrap: app.set('agenda', agenda))
        // const agenda = req.app.get('agenda');
        const agenda = Agenda2.getAgenda();

        // Always cancel any existing scheduled "move to live" for this car
        await agenda.cancel({
            name: CONSTANTS.AGENDA_JOBS.MOVE_CAR_FROM_UPCOMING_TO_LIVE,
            'data.carId': carId,
        });

        const isNow = (auctionMode === 'makeLiveNow');

        if (isNow) {
            // Flip to LIVE immediately (idempotent)
            await Car.updateOne(
                { _id: carId }, // allow flipping from upcoming or correcting fields if already live
                {
                    $set: {
                        auctionStatus: CONSTANTS.AUCTION_STATUS.LIVE,
                        liveAt: now,
                        auctionStartTime: now,
                        auctionDuration: durationHrs,
                        auctionEndTime: new Date(now.getTime() + durationHrs * 3600 * 1000),
                        upcomingUntil: now,
                    },
                }
            );

            // Emit sockets to keep clients in sync
            const fresh = await Car.findById(carId).lean();
            const listing = CarDetailsForCarsListModel.setCarDetails(fresh);

            SocketService.emitToRoom(
                EVENTS.UPCOMING_BIDS_SECTION_ROOM,
                EVENTS.UPCOMING_BIDS_SECTION_UPDATED,
                { action: 'removed', id: carId.toString(), car: listing, message: 'Car moved from UPCOMING to LIVE' }
            );
            SocketService.emitToRoom(
                EVENTS.LIVE_BIDS_SECTION_ROOM,
                EVENTS.LIVE_BIDS_SECTION_UPDATED,
                { action: 'added', id: carId.toString(), car: listing, message: 'Car is now LIVE' }
            );

            return res.json({ ok: true, mode: 'now' });
        } else {
            // Save upcoming schedule on car
            await Car.updateOne(
                { _id: carId },
                {
                    $set: {
                        auctionStatus: 'upcoming',
                        auctionStartTime: start,
                        auctionDuration: durationHrs,
                        auctionEndTime: new Date(start.getTime() + durationHrs * 3600 * 1000),
                        upcomingUntil: start,
                    },
                }
            );

            // Reschedule: either upsert via unique() helper or recreate cleanly
            await scheduleMoveCarFromUpcomingToLive(agenda, carId, start);

            // Optionally tell clients this upcoming item got updated (so their countdown resets)
            try {
                const fresh = await Car.findById(carId).lean();
                const listing = CarDetailsForCarsListModel.setCarDetails(fresh);

                SocketService.emitToRoom(
                    EVENTS.UPCOMING_BIDS_SECTION_ROOM,
                    EVENTS.UPCOMING_BIDS_SECTION_UPDATED,
                    {
                        action: 'updated', // <- differentiate from a new add
                        id: carId.toString(),
                        car: listing,
                        upcomingUntil: start,
                        message: 'Upcoming auction rescheduled',
                    }
                );
            } catch (_) { }

            return res.json({ ok: true, mode: 'schedule' });
        }
    } catch (err) {
        console.error('[updateCarAuctionTime] error:', err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
};














exports.updateAuctionTime1 = async (req, res) => {
    try {
        const { carId, auctionStartTime, auctionDuration } = req.body;

        if (!carId) {
            return res.status(400).json({ error: 'carId is required' });
        }

        const updateData = {};
        let startTimeToUse = null;

        // Set auctionStartTime if provided
        if (auctionStartTime) {
            const parsedStart = new Date(auctionStartTime);
            updateData.auctionStartTime = parsedStart;
            startTimeToUse = parsedStart;
        }

        // Set auctionDuration if provided
        if (auctionDuration !== undefined) {
            updateData.auctionDuration = auctionDuration;
        }

        // If either startTime or duration is being updated, calculate auctionEndTime
        if ((auctionStartTime || auctionDuration !== undefined)) {
            // Get current car data to fill missing value if one is not provided
            const car = await CarModel.findById(carId);
            if (!car) return res.status(404).json({ error: 'Car not found' });

            const finalStartTime = startTimeToUse || car.auctionStartTime;
            const finalDuration = auctionDuration !== undefined ? auctionDuration : car.auctionDuration;

            if (finalStartTime && finalDuration !== undefined) {
                const endTime = new Date(new Date(finalStartTime).getTime() + finalDuration * 3600000);
                updateData.auctionEndTime = endTime;
            }
        }

        // ✅ Force auction status to "live" when updating
        updateData.auctionStatus = CONSTANTS.AUCTION_STATUS.LIVE;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedCar = await CarModel.findByIdAndUpdate(
            carId,
            updateData,
            { new: true }
        );

        if (!updatedCar) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // emit to that car room
        SocketService.emitToRoom(
            EVENTS.AUCTION_TIMER_ROOM,
            EVENTS.AUCTION_TIMER_UPDATED,
            {
                carId: updatedCar._id.toString(),
                auctionStartTime: updatedCar.auctionStartTime,
                auctionEndTime: updatedCar.auctionEndTime,
                auctionDuration: updatedCar.auctionDuration,
                auctionStatus: updatedCar.auctionStatus
            }
        );

        // Tell the ui that a new car is added in the live bids section
        const { addCarToLiveBidsHelper } = require('../Helper Functions/add_car_to_live_bids_helper');
        const addedCar = addCarToLiveBidsHelper(updatedCar);

        SocketService.emitToRoom(EVENTS.LIVE_BIDS_SECTION_ROOM, EVENTS.LIVE_BIDS_SECTION_UPDATED, {
            action: 'added',
            id: updatedCar._id.toString(),
            car: addedCar,
            message: 'Car added to live bids section',
        });


        // ✅ Just one line to schedule
        const AgendaJobs = require('../Config/agenda_jobs');
        await AgendaJobs.scheduleAuctionEnd(updatedCar._id.toString(), updatedCar.auctionEndTime);


        res.json({ success: true, data: updatedCar });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update car fields' });
    }
};