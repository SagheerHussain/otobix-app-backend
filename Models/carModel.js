// models/CarDetails.js
const mongoose = require('mongoose');

// Use an empty schema with strict: false to allow any structure
const CarDetailsSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('CarDetails', CarDetailsSchema, 'cars');
//                     ^ model name         ^ schema       ^ MongoDB collection name
