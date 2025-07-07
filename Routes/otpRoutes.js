
const express = require("express");
const router = express.Router();

const { sendOtp, verifyOtp } = require("../Controllers/otpController");

// POST /api/send-otp
router.post("/send-otp", sendOtp);

// POST /api/verify-otp
router.post("/verify-otp", verifyOtp);

module.exports = router;
