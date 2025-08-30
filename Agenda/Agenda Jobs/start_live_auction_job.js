// /Agenda/Agenda Jobs/start-live-auction-job.js
'use strict';

const mongoose = require('mongoose');
const Car = require('../../Models/carModel');
const SocketService = require('../../Config/socket_service');
const EVENTS = require('../../Sockets/socket_events');
const CONSTANTS = require('../../Utils/constants');
const CarDetailsForCarsListModel = require('../../Shared/car_details_for_cars_list_model');

module.exports = (agenda) => {
    /**
     * (Optional) START job — ensures the car is LIVE at start time
     * and schedules the END job based on duration/end time.
     * Useful if you want a single “start” entry point. If you already flip in
     * move-car-to-live, you can skip scheduling this and only schedule END job.
     */
    agenda.define(
        CONSTANTS.AGENDA_JOBS.START_LIVE_AUCTION,
        { priority: 'high', concurrency: 50, lockLifetime: 120_000 },
        async (job, done) => {
            try {
                const { carId } = job.attrs.data || {};
                if (!carId || !mongoose.isValidObjectId(carId)) {
                    return done(new Error('Invalid or missing carId'));
                }

                const now = new Date();

                // Ensure car exists
                const car = await Car.findById(carId);
                if (!car) return done(); // nothing to do

                // If not live yet, make it live (idempotent)
                if (car.auctionStatus !== CONSTANTS.AUCTION_STATUS.LIVE) {
                    await Car.updateOne(
                        { _id: carId, auctionStatus: { $ne: CONSTANTS.AUCTION_STATUS.LIVE } },
                        {
                            $set: {
                                auctionStatus: CONSTANTS.AUCTION_STATUS.LIVE,
                                liveAt: now,
                                auctionStartTime: car.auctionStartTime || now,
                                auctionEndTime:
                                    car.auctionEndTime ||
                                    new Date((car.auctionStartTime || now).getTime() + (car.auctionDuration || 2) * 3600 * 1000),
                                upcomingUntil: now,
                            },
                        }
                    );

                    // emit updates (optional)
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
                }

                // Schedule END job using stored end time
                const latest = await Car.findById(carId).lean();
                const endAt = latest?.auctionEndTime
                    ? new Date(latest.auctionEndTime)
                    : new Date((latest.auctionStartTime || now).getTime() + (latest.auctionDuration || 2) * 3600 * 1000);

                await module.exports.scheduleEndLiveAuction(agenda, carId, endAt);

                // Defense-in-depth: remove any duplicate START jobs for same car
                await agenda.cancel({ name: CONSTANTS.AGENDA_JOBS.START_LIVE_AUCTION, 'data.carId': carId });

                return done();
            } catch (err) {
                return done(err);
            }
        }
    );

    /**
     * END job — marks the auction as ended (idempotent).
     * Runs at auctionEndTime.
     */
    agenda.define(
        CONSTANTS.AGENDA_JOBS.END_LIVE_AUCTION,
        { priority: 'high', concurrency: 50, lockLifetime: 120_000 },
        async (job, done) => {
            try {
                const { carId } = job.attrs.data || {};
                if (!carId || !mongoose.isValidObjectId(carId)) {
                    return done(new Error('Invalid or missing carId'));
                }

                const now = new Date();

                // Atomic flip: only if still live
                const result = await Car.updateOne(
                    { _id: carId, auctionStatus: CONSTANTS.AUCTION_STATUS.LIVE },
                    {
                        $set: {
                            auctionStatus: CONSTANTS.AUCTION_STATUS.LIVEAUCTIONENDED, // e.g., 'auctionEnded'
                            auctionEndedAt: now,
                        },
                    }
                );

                if (result.modifiedCount === 1) {
                    // Broadcast UI changes
                    const updated = await Car.findById(carId).lean();
                    const listing = CarDetailsForCarsListModel.setCarDetails(updated);

                    // remove from LIVE section
                    SocketService.emitToRoom(
                        EVENTS.LIVE_BIDS_SECTION_ROOM,
                        EVENTS.LIVE_BIDS_SECTION_UPDATED,
                        { action: 'removed', id: carId.toString(), car: listing, message: 'Auction ended' }
                    );

                    // (optional) add to ENDED section if you have one
                    // if (EVENTS.ENDED_BIDS_SECTION_ROOM && EVENTS.ENDED_BIDS_SECTION_UPDATED) {
                    //     SocketService.emitToRoom(
                    //         EVENTS.ENDED_BIDS_SECTION_ROOM,
                    //         EVENTS.ENDED_BIDS_SECTION_UPDATED,
                    //         { action: 'added', id: carId.toString(), car: listing, message: 'Car moved to ENDED' }
                    //     );
                    // }

                    // Clean any stray END jobs for this car
                    await agenda.cancel({ name: CONSTANTS.AGENDA_JOBS.END_LIVE_AUCTION, 'data.carId': carId });
                }

                return done();
            } catch (err) {
                return done(err);
            }
        }
    );
};

/** Helper: schedule a unique START job at startAt */
// module.exports.scheduleStartLiveAuction = async function scheduleStartLiveAuction(agenda, carId, startAt) {
//     const job = agenda.create(CONSTANTS.AGENDA_JOBS.START_LIVE_AUCTION, { carId });
//     job.unique({ name: CONSTANTS.AGENDA_JOBS.START_LIVE_AUCTION, 'data.carId': carId });
//     job.schedule(startAt);
//     await job.save();
//     return job;
// };

/** Helper: schedule a unique END job at endAt */
module.exports.scheduleEndLiveAuction = async function scheduleEndLiveAuction(agenda, carId, endAt) {
    const job = agenda.create(CONSTANTS.AGENDA_JOBS.END_LIVE_AUCTION, { carId });
    job.unique({ name: CONSTANTS.AGENDA_JOBS.END_LIVE_AUCTION, 'data.carId': carId });
    job.schedule(endAt);
    await job.save();
    return job;
};
