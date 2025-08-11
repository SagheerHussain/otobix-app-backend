// utils/agendaJobs.js
const Car = require('../Models/carModel');
const User = require('../Models/userModel');
const BidModel = require('../Models/bidModel');
const socketService = require('../Config/socket_service');
const CONSTANTS = require('../Utils/constants');
const EVENTS = require('../Sockets/socket_events');
let agendaInstance = null;

const defineJobs = (agenda) => {
    agendaInstance = agenda; // store reference for scheduling

    // Define job: end auction
    agenda.define('end auction', async (job) => {
        const { carId } = job.attrs.data;
        // console.log(`[Agenda Job] Running 'end auction' for car ${carId}`);

        try {
            // Find car details
            const car = await Car.findById(carId).lean();
            // Find Winner details
            const winner = await User.findById(car.highestBidder).select('userName').lean();
            const winnerName = winner?.userName ?? '';

            // Find bidders list
            const biddersList = await BidModel.distinct('userId', { carId });

            // Emit auction ended event
            socketService.broadcast(EVENTS.AUCTION_ENDED, {
                carId: car._id.toString(),
                carName: `${car.make ?? ''} ${car.model ?? ''} ${car.variant ?? ''}`.trim(),
                bidAmount: car.highestBid,
                winnerId: car.highestBidder,
                winnerName,
                biddersList,
                message: '🎉 Auction ended. Winner declared!',
            });

            // Update auction status (use the actual constant you defined)
            await Car.updateOne(
                { _id: car._id },
                { $set: { auctionStatus: CONSTANTS.AUCTION_STATUS.ENDED } }
            );

            console.log(`[Agenda Job] Auction ended for car ${carId}`);
        } catch (err) {
            console.error(`[Agenda Job] Error for car ${carId}:`, err.message);
        }
    });

    console.log('[AgendaJobs] Jobs defined.');
};

const scheduleAuctionEnd = async (carId, endTime) => {
    if (!agendaInstance) throw new Error('Agenda not initialized');
    await agendaInstance.schedule(endTime, 'end auction', { carId });
    console.log(`[AgendaJobs] Scheduled 'end auction' for car ${carId} at ${endTime}`);
};

// Export both job loader and scheduler methods
module.exports = {
    defineJobs,
    scheduleAuctionEnd,
};
