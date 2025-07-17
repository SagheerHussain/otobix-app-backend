const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { userName, phoneNumber, password } = req.body;

    if (!userName || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Dealer name, contact number, and password are required' });
    }

    const user = await User.findOne({ userName: userName }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.phoneNumber !== phoneNumber) {
      return res.status(401).json({ message: 'Invalid contact number' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
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
        userName: user.userName,
        userType: user.userRole,
        approvalStatus: user.approvalStatus,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
