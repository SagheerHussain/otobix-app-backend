// Agenda/Agenda Jobs/move-car-to-live.js
const mongoose = require('mongoose');
const Car = require('../../Models/carModel');
const SocketService = require('../../Config/socket_service');
const CONSTANTS = require('../../Utils/constants');
const EVENTS = require('../../Sockets/socket_events');
const { scheduleEndLiveAuction } = require('./start_live_auction_job');

/**
 * Job: move-car-to-live
 * - Runs ONCE at its scheduled time.
 * - Uniqueness key: (job name + carId) so the same car cannot be scheduled twice.
 * - Idempotent DB update: flips only if still 'upcoming'.
 */
module.exports = (agenda) => {
  agenda.define(
    CONSTANTS.AGENDA_JOBS.MOVE_CAR_FROM_UPCOMING_TO_LIVE,
    { priority: 'high', concurrency: 50, lockLifetime: 30_000 },
    async (job, done) => {
      try {
        const { carId } = job.attrs.data || {};
        if (!carId || !mongoose.isValidObjectId(carId)) {
          return done(new Error('Invalid or missing carId'));
        }

        const now = new Date();

        // Atomic one-time flip. If already flipped, modifiedCount = 0.
        const result = await Car.updateOne(
          { _id: carId, auctionStatus: 'upcoming' },
          {
            $set: { auctionStatus: 'live', liveAt: now },
            // $unset: { upcomingUntil: '' },
          }
        );

        // If car is moved from UPCOMING to LIVE
        if (result.modifiedCount === 1) {

          // Fetch updated doc
          const updated = await Car.findById(carId).lean();

          const carDataForCarsListModelInFlutter = buildListing(updated);

          // 🔴 EMIT to upcoming room (removed)
          SocketService.emitToRoom(
            EVENTS.UPCOMING_BIDS_SECTION_ROOM,
            EVENTS.UPCOMING_BIDS_SECTION_UPDATED,
            {
              action: 'removed',
              id: carId.toString(),
              car: carDataForCarsListModelInFlutter,
              message: 'Car moved from UPCOMING to LIVE',
            }
          );

          // 🟢 EMIT to live room (added)
          SocketService.emitToRoom(
            EVENTS.LIVE_BIDS_SECTION_ROOM,
            EVENTS.LIVE_BIDS_SECTION_UPDATED,
            {
              action: 'added',
              id: carId.toString(),
              car: carDataForCarsListModelInFlutter,
              message: 'Car is now LIVE',
            }
          );


          // Start live auction after you set auctionStatus: 'live', liveAt, auctionStartTime, auctionDuration, auctionEndTime
          await scheduleEndLiveAuction(agenda, carId, updated.auctionEndTime || new Date(now.getTime() + updated.auctionDuration * 3600 * 1000));



          // Cleanup (defense-in-depth): remove any stray future jobs for same car
          await agenda.cancel({ name: CONSTANTS.AGENDA_JOBS.MOVE_CAR_FROM_UPCOMING_TO_LIVE, 'data.carId': carId });
        }

        return done();
      } catch (err) {
        return done(err);
      }
    }
  );
};





// Helper to schedule a unique one-off run time.
module.exports.scheduleMoveCarFromUpcomingToLive = async function scheduleMoveCarFromUpcomingToLive(
  agenda,
  carId,
  when // Date or parsable string
) {
  const job = agenda.create(CONSTANTS.AGENDA_JOBS.MOVE_CAR_FROM_UPCOMING_TO_LIVE, { carId });

  // Uniqueness: prevent duplicate jobs for the same car
  job.unique({ name: CONSTANTS.AGENDA_JOBS.MOVE_CAR_FROM_UPCOMING_TO_LIVE, 'data.carId': carId });

  job.schedule(when);
  await job.save();



  // ✅ Immediately announce to UPCOMING room (single place, no extra jobs)
  try {
    // Read fresh car (optional but nice to send full payload)
    const car = await Car.findById(carId).lean();

    // Only announce if it’s really marked upcoming right now
    if (car && car.auctionStatus === 'upcoming') {
      const carDataForCarsListModelInFlutter = buildListing(car);

      SocketService.emitToRoom(
        EVENTS.UPCOMING_BIDS_SECTION_ROOM,
        EVENTS.UPCOMING_BIDS_SECTION_UPDATED,
        {
          action: 'added',                 // or 'updated' for reschedules
          id: carId.toString(),
          car: carDataForCarsListModelInFlutter,
          upcomingUntil: when instanceof Date ? when : new Date(when),
          message: 'Car added to UPCOMING (countdown scheduled)',
        }
      );
    }
  } catch (_) { }


  return job;
};


// Build the client-facing "listing" payload (same shape as getCarList)
function buildListing(src) {
  const car = src?.toObject ? src.toObject() : (src || {});

  const getFirstImage = (val) => {
    if (Array.isArray(val)) return val.length > 0 ? val[0] : null;
    if (typeof val === 'string') return val || null;
    return null;
  };

  const imageMapping = [
    { field: 'frontMain', title: 'Front View' },
    { field: 'rearMain', title: 'Rear View' },
    { field: 'lhsFront45Degree', title: 'Left Front 45°' },
    { field: 'rhsRear45Degree', title: 'Right Rear 45°' },
    { field: 'rearWithBootDoorOpen', title: 'Boot Open View' },
    { field: 'engineBay', title: 'Engine Compartment' },
    { field: 'meterConsoleWithEngineOn', title: 'Meter Console' },
    { field: 'frontSeatsFromDriverSideDoorOpen', title: 'Front Seats' },
    { field: 'rearSeatsFromRightSideDoorOpen', title: 'Rear Seats' },
    { field: 'dashboardFromRearSeat', title: 'Dashboard View' },
    { field: 'sunroofImages', title: 'Sunroof View' },
  ];

  const imageUrls = imageMapping
    .map(({ field, title }) => {
      const url = getFirstImage(car[field]);
      return url ? { title, url } : null;
    })
    .filter(Boolean);

  const imageUrl = getFirstImage(car.frontMain) || '';

  const isInspected = String(car.approvalStatus || '').toUpperCase() === 'APPROVED';

  const num = (v) => {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const int = (v) => {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    id: (car._id || car.id || '').toString(),
    imageUrl,
    make: car.make ?? '',
    model: car.model ?? '',
    variant: car.variant ?? '',
    priceDiscovery: num(car.priceDiscovery),
    yearMonthOfManufacture: car.yearMonthOfManufacture ?? null,
    odometerReadingInKms: int(car.odometerReadingInKms),
    ownerSerialNumber: int(car.ownerSerialNumber),
    fuelType: car.fuelType ?? '',
    commentsOnTransmission: car.commentsOnTransmission ?? '',
    taxValidTill: car.taxValidTill ?? null,
    registrationNumber: car.registrationNumber ?? '',
    registeredRto: car.registeredRto ?? '',
    inspectionLocation: car.city ?? car.inspectionLocation ?? '',
    isInspected,
    highestBid: num(car.highestBid),
    auctionStartTime: car.auctionStartTime ?? null,
    auctionEndTime: car.auctionEndTime ?? null,
    auctionDuration: int(car.auctionDuration),
    auctionStatus: car.auctionStatus ?? '',
    upcomingTime: car.upcomingTime ?? null,
    upcomingUntil: car.upcomingUntil ?? null,
    liveAt: car.liveAt ?? null,
    imageUrls,
  };
}
