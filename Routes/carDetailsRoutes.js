const express = require("express");
const router = express.Router();
const { getCarDetails } = require("../Controllers/car_details_controller");
const { getCarList } = require("../Controllers/car_details_controller");

router.get("/details/:id", getCarDetails);
router.get("/cars-list", getCarList);

module.exports = router;