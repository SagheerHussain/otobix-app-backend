const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { dealerName, contactNumber, password } = req.body;

    if (!dealerName || !contactNumber || !password) {
      return res.status(400).json({ message: 'Dealer name, contact number, and password are required' });
    }

    const user = await User.findOne({ userName: dealerName }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.phoneNumber !== contactNumber) {
      return res.status(401).json({ message: 'Invalid contact number' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        dealerName: user.userName,
        userType: user.userRole
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        dealerName: user.userName,
        userType: user.userRole,
        approvalStatus: user.approvalStatus,
        contactNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
