// utils/agendaJobs.js
const Car = require('../Models/carModel');
const socketService = require('../Config/socket_service');
const EVENTS = require('../Sockets/socket_events');
let agendaInstance = null;

const defineJobs = (agenda) => {
    agendaInstance = agenda; // store reference for scheduling

    // Define job: end auction
    agenda.define('end auction', async (job) => {
        const { carId } = job.attrs.data;
        // console.log(`[Agenda Job] Running 'end auction' for car ${carId}`);

        try {
            const car = await Car.findById(carId);
            socketService.broadcast(EVENTS.AUCTION_ENDED, {
                carId: car._id.toString(),
                bidAmount: car.highestBid,
                winnerId: car.highestBidder,
                message: '🎉 Auction ended. Winner declared!',
            });



            car.auctionStatus = 'ended';
            await car.save();
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
