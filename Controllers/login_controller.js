const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { dealerName, contactNumber, password } = req.body;

    if (!dealerName || !contactNumber || !password) {
      return res.status(400).json({ message: 'Dealer name, contact number, and password are required' });
    }

    // Find user by dealerName and include password
    const user = await User.findOne({ dealerName }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check contact number
    if (user.contactNumber !== contactNumber) {
      return res.status(401).json({ message: 'Invalid contact number' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        dealerName: user.dealerName,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        dealerName: user.dealerName,
        userType: user.userType,
        approvalStatus: user.approvalStatus,
        contactNumber: user.contactNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
