const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    carId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    bidAmount: {
        type: Number,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BidModel', bidSchema, 'bids');
