// utils/agenda.js
const { Agenda } = require('agenda');
require('dotenv').config();

const agenda = new Agenda({
    db: {
        address: process.env.MONGO_URI,
        collection: 'agendaJobs',
    },
    processEvery: '10 seconds',
});

// Load jobs and scheduling functions
const AgendaJobs = require('./agenda_jobs');
AgendaJobs.defineJobs(agenda);

// Start Agenda
(async () => {
    await agenda.start();
})();

module.exports = { agenda, AgendaJobs };





// const { Agenda } = require('agenda');
// const Car = require('../Models/carModel');
// const socketService = require('../Config/socket_service');
// require('dotenv').config();

// const agenda = new Agenda({
//     db: {
//         address: process.env.MONGO_URI,
//         collection: 'agendaJobs'
//     }
// });

// agenda.define('end auction', async (job) => {
//     const { carId } = job.attrs.data;

//     try {
//         const car = await Car.findById(carId);
//         if (!car || car.auctionStatus !== 'live') return;

//         if (car.highestBidder) {
//             const io = socketService.getIO(); // ✅ get instance here

//             io.to(car.highestBidder).emit('auctionWon', {
//                 carId: car._id.toString(),
//                 bidAmount: car.highestBid,
//                 message: '🎉 You have won the auction!'
//             });

//             console.log(`[Agenda] Winner notified for car ${car._id}`);
//         }

//         car.auctionStatus = 'ended';
//         await car.save();

//     } catch (err) {
//         console.error(`[Agenda] Error ending auction for car ${carId}:`, err.message);
//     }
// });

// (async function () {
//     await agenda.start();
// })();

// module.exports = agenda;
