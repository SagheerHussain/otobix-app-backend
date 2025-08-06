const express = require("express");
const router = express.Router();
const { getCarDetails, getCarList, updateBid } = require("../Controllers/car_details_controller");
// const { getCarList } = require("../Controllers/car_details_controller");


router.get("/details/:id", getCarDetails);
router.get("/cars-list", getCarList);
router.post('/update-bid', updateBid);




module.exports = router;