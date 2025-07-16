const User = require('../Models/userModel');
const sendEmail = require('../Utils/node_mailer');

exports.register = async (req, res) => {
  try {
    const {
      userType,
      contactNumber,
      location,
      dealerName,
      dealerEmail,
      dealershipName,
      entityType,
      primaryContactPerson,
      primaryContactNumber,
      secondaryContactPerson,
      secondaryContactNumber,
      password,
      addressList
    } = req.body;

    if (!userType || !contactNumber || !location || !password || !addressList) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    if (userType === 'Dealer') {
      if (
        !dealerName || !dealerEmail || !dealershipName || !entityType ||
        !primaryContactPerson || !primaryContactNumber
      ) {
        return res.status(400).json({ message: 'Missing required Dealer fields.' });
      }

      const existingDealer = await User.findOne({ dealerEmail });
      if (existingDealer) {
        return res.status(400).json({ message: 'Dealer already exists with this email.' });
      }

    } else if (userType === 'customer' || userType === 'sales manager') {
      if (!dealerName || !dealerEmail) {
        return res.status(400).json({ message: `Missing required fields for ${userType}.` });
      }

      const existingUser = await User.findOne({ dealerEmail });
      if (existingUser) {
        return res.status(400).json({ message: `${userType} already exists with this email.` });
      }

    } else {
      return res.status(400).json({ message: 'Invalid userType provided.' });
    }

    const user = new User({
      userType,
      contactNumber,
      location,
      dealerName,
      dealerEmail,
      dealershipName,
      entityType,
      primaryContactPerson,
      primaryContactNumber,
      secondaryContactPerson,
      secondaryContactNumber,
      password,
      addressList,
      approvalStatus: 'Pending'
    });

    await user.save();

    // Send email
    await sendEmail(
      dealerEmail,
      'Welcome to Otobix!',
      `Dear ${dealerName},\n\nThank you for registering with Otobix.\nYour account is under review.\n\nBest regards,\nTeam Otobix`
    );

    res.status(201).json({
      message: `${userType} registered successfully!`,
      user,
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await Dealer.find({ approvalStatus: "Pending" });

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

    // Validate approvalStatus
    if (!['Approved', 'Rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status. Must be Approved or Rejected.',
      });
    }

    // Find user
    const user = await Dealer.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update status
    user.approvalStatus = approvalStatus;

    if (approvalStatus === 'Rejected') {
      // optionally save comment if rejected
      user.rejectionComment = comment || '';
    } else {
      user.rejectionComment = ''; // clear any previous comment
    }

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
    const user = await Dealer.findById(userId);
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

    const user = await Dealer.findById(userId).select(
      'approvalStatus  rejectionComment dealerName dealerEmail'
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














