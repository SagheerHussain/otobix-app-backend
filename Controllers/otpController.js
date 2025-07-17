const perfios = require('../Utils/perfios_services');

exports.sendOtp = async (req, res) => {
  const { mobile, caseId } = req.body;

  try {
    const result = await perfios.sendOtp(mobile, caseId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { requestId, otp, caseId } = req.body;

  try {
    const result = await perfios.verifyOtp(requestId, otp, caseId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchDetails = async (req, res) => {
  const { requestId, caseId } = req.body;

  try {
    const result = await perfios.fetchDetails(requestId, caseId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// // sendOtpController.js
// const twilio = require("twilio");
// require("dotenv").config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioClient = twilio(accountSid, authToken);
// const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// const otpStore = {};
// const sendOtp = async (req, res) => {
//     try {
//       let { phoneNumber } = req.body;
  
//       if (!phoneNumber) {
//         return res.status(400).json({
//           success: false,
//           message: "Phone number is required",
//         });
//       }
  
//       // Normalize to +92 format
//       if (phoneNumber.startsWith("0")) {
//         phoneNumber = "+92" + phoneNumber.slice(1);
//       } else if (!phoneNumber.startsWith("+92")) {
//         phoneNumber = "+92" + phoneNumber;
//       }
  
//       // Validate format
//       if (!/^\+92\d{10}$/.test(phoneNumber)) {
//         return res.status(400).json({
//           success: false,
//           message: "Please enter a valid Pakistani number in format 03XXXXXXXXX",
//         });
//       }
  
//       const otp = Math.floor(100000 + Math.random() * 900000);
//       console.log("OTP sent to:", phoneNumber);
//       otpStore[phoneNumber] = {
//         otp,
//         expiresAt: Date.now() + 5 * 60 * 1000,
//       };
  
//       const msg = await twilioClient.messages.create({
//         body: `Your OtoBix OTP is ${otp}`,
//         from: TWILIO_PHONE_NUMBER,
//         to: phoneNumber,
//       });
  
//       console.log("Message SID:", msg.sid);
  
//       res.status(200).json({
//         success: true,
//         message: "OTP sent successfully",
//       });
//     } catch (error) {
//       console.error("Error sending OTP:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Failed to send OTP",
//         error: error.message,
//       });
//     }
//   };
  
// const verifyOtp = (req, res) => {
//     try {
//         let { phoneNumber, otp } = req.body;

//         if (!phoneNumber || !otp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Phone number and OTP are required",
//             });
//         }

//         if (phoneNumber.startsWith('0')) {
//             phoneNumber = '+92' + phoneNumber.slice(1);
//         } else if (!phoneNumber.startsWith('+92')) {
//             phoneNumber = '+92' + phoneNumber;
//         }

//         const record = otpStore[phoneNumber];

//         if (!record) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No OTP found for this number",
//             });
//         }

//         if (Date.now() > record.expiresAt) {
//             delete otpStore[phoneNumber];
//             return res.status(400).json({
//                 success: false,
//                 message: "OTP expired",
//             });
//         }

//         if (record.otp.toString() !== otp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid OTP",
//             });
//         }
//         delete otpStore[phoneNumber];

//         return res.status(200).json({
//             success: true,
//             message: "OTP verified successfully",
//         });
//     } catch (error) {
//         console.error("Error verifying OTP:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Server error",
//             error: error.message,
//         });
//     }
// };
// module.exports = {
//     sendOtp,
//     verifyOtp,
// };

