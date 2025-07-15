
// sendOtpController.js
const twilio = require("twilio");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Simple in-memory store
const otpStore = {};

const sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[phoneNumber] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };

        await twilioClient.messages.create({
            body: `Your OtoBix OTP is ${otp}`,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            // otp, // remove in production
        });
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message,
        });
    }
};

const verifyOtp = (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required",
            });
        }

        const record = otpStore[phoneNumber];

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this number",
            });
        }

        if (Date.now() > record.expiresAt) {
            delete otpStore[phoneNumber];
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        if (record.otp.toString() !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // OTP verified
        delete otpStore[phoneNumber];

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
};

