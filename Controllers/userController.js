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
  
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
  
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


exports.getUserProfile = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      let profile = {
        role: user.userRole,
        name: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        image: user.image,
        location: user.location,
      };
  
      switch (user.userRole) {
        case 'Dealer':
          profile = {
            ...profile,
            dealershipName: user.dealershipName,
            entityType: user.entityType,
            primaryContactPerson: user.primaryContactPerson,
            primaryContactNumber: user.primaryContactNumber,
            secondaryContactPerson: user.secondaryContactPerson,
            secondaryContactNumber: user.secondaryContactNumber,
            addressList: user.addressList,
          };
          break;
  
        case 'sales manager':
        case 'customer':
          profile = {
            ...profile,
            addressList: user.addressList,
          };
          break;
  
        case 'admin':
          profile = {
            ...profile,
            permissions: 'Full Access',
          };
          break;
  
        default:
          return res.status(400).json({ message: 'Invalid user role.' });
      }
  
      res.status(200).json({
        success: true,
        message: 'User profile fetched successfully.',
        profile,
      });
  
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  

  exports.updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email, phoneNumber, location } = req.body;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;
      user.location = location;
  
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'User profile updated successfully.',
        user,
      });
  
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  exports.updateUserProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const {
        userName,
        email,
        phoneNumber,
        location,
        dealershipName,
        entityType,
        primaryContactPerson,
        primaryContactNumber,
        secondaryContactPerson,
        secondaryContactNumber,
        addressList
      } = req.body;
  
      user.userName = userName || user.userName;
      user.email = email || user.email;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.location = location || user.location;
  
      if (req.file) {
        const imageUrl = req.file.path;
        user.image = imageUrl;
      }
  
      switch (user.userRole) {
        case 'Dealer':
          user.dealershipName = dealershipName || user.dealershipName;
          user.entityType = entityType || user.entityType;
          user.primaryContactPerson = primaryContactPerson || user.primaryContactPerson;
          user.primaryContactNumber = primaryContactNumber || user.primaryContactNumber;
          user.secondaryContactPerson = secondaryContactPerson || user.secondaryContactPerson;
          user.secondaryContactNumber = secondaryContactNumber || user.secondaryContactNumber;
          if (addressList && Array.isArray(addressList)) {
            user.addressList = addressList;
          }
          break;
  
        case 'sales manager':
        case 'customer':
          if (addressList && Array.isArray(addressList)) {
            user.addressList = addressList;
          }
          break;
  
        case 'admin':
          // No extra fields for admin
          break;
  
        default:
          return res.status(400).json({ message: 'Invalid user role.' });
      }
  
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'User profile updated successfully.',
        user,
      });
  
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  