
const express = require('express');
const router = express.Router();
const otpController = require('../Controllers/otpController');

router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/fetch-details', otpController.fetchDetails);

module.exports = router;



// const express = require("express");
// const router = express.Router();

// const { sendOtp, verifyOtp } = require("../Controllers/otpController");

// // POST /api/send-otp
// router.post("/send-otp", sendOtp);

// // POST /api/verify-otp
// router.post("/verify-otp", verifyOtp);

// module.exports = router;
