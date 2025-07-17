const User = require('../Models/userModel');
const sendEmail = require('../Utils/node_mailer');
exports.register = async (req, res) => {
    try {
      const {
        userRole,
        phoneNumber,
        location,
        userName,
        email,
        dealershipName,
        entityType,
        primaryContactPerson,
        primaryContactNumber,
        secondaryContactPerson,
        secondaryContactNumber,
        password,
        addressList
      } = req.body;
  
      if (!userRole || !userName || !email || !phoneNumber || !location || !password || !addressList) {
        return res.status(400).json({ message: 'Please fill all required fields.' });
      }
  
      if (userRole === 'Dealer') {
        if (!dealershipName || !entityType || !primaryContactPerson || !primaryContactNumber) {
          return res.status(400).json({ message: 'Missing required Dealer fields.' });
        }
      } else if (!['customer', 'sales manager', 'admin'].includes(userRole)) {
        return res.status(400).json({ message: 'Invalid userRole provided.' });
      }
  
      // 🔍 Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
  
      // 🔍 Check if phone number already exists
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone Number already exists.' });
      }
  
      const user = new User({
        userRole,
        phoneNumber,
        location,
        userName,
        email,
        dealershipName,
        entityType,
        primaryContactPerson,
        primaryContactNumber,
        secondaryContactPerson: secondaryContactPerson || '',
        secondaryContactNumber: secondaryContactNumber || '',
        password,
        addressList,
        approvalStatus: 'Pending'
      });
  
      await user.save();
  
      await sendEmail(
        email,
        'Welcome to Otobix!',
        `Dear ${userName},\n\nThank you for registering with Otobix.\nYour account is under review.\n\nBest regards,\nTeam Otobix`
      );
  
      res.status(201).json({
        message: `${userRole} registered successfully!`,
        user
      });
  
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ approvalStatus: "Pending" });

    res.status(200).json({
      success: true,
      message: 'Pending users fetched successfully.',
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { approvalStatus, comment } = req.body;

    if (!['Approved', 'Rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status. Must be Approved or Rejected.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.approvalStatus = approvalStatus;
    user.rejectionComment = approvalStatus === 'Rejected' ? (comment || '') : '';

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${approvalStatus} successfully.`,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.token = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User logged out successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.getUserStatusById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      'approvalStatus rejectionComment userName email'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status fetched successfully.',
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const existingUser = await User.findOne({ userName: { $regex: `^${username}$`, $options: 'i' } });

    if (existingUser) {
      return res.status(200).json({ available: false, message: 'Username already exists.' });
    } else {
      return res.status(200).json({ available: true, message: 'Username is available.' });
    }

  } catch (error) {
    console.error('Check Username Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
