const express = require("express");
const router = express.Router();
const { getCarDetails, getCarList, updateBid, updateAuctionTime, checkHighestBidder } = require("../Controllers/car_details_controller");
// const { getCarList } = require("../Controllers/car_details_controller");


router.get("/details/:id", getCarDetails);
router.get("/cars-list", getCarList);
router.post('/update-bid', updateBid);
router.post('/update-auction-time', updateAuctionTime);
router.post('/check-highest-bidder', checkHighestBidder);




module.exports = router;