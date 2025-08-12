// models/AutoBid.js
const mongoose = require('mongoose');

const AutoBidModelForLiveSectionSchema = new mongoose.Schema({
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    maxAmount: { type: Number, required: true },
    increment: { type: Number, default: 1000 }, // Rs 1000 default
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

AutoBidModelForLiveSectionSchema.index({ carId: 1, userId: 1 }, { unique: true }); // one autobid per (car,user)

module.exports = mongoose.model('AutoBidModelForLiveSection', AutoBidModelForLiveSectionSchema, 'autoBidsForLiveSection');
