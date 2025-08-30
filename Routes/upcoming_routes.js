// routes/upcoming_routes.js
const router = require('express').Router();
const { updateCarAuctionTime } = require('../Controllers/upcoming_controller');

router.post('/update-car-auction-time', updateCarAuctionTime);

module.exports = router;
