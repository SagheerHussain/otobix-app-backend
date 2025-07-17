const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['Dealer', 'customer', 'sales manager', 'admin'],
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },

  dealerName: {
    type: String,
    required: true,
  },
  dealerEmail: {
    type: String,
    required: true,
    // unique: true,
  },

  // Dealer-only fields
  dealershipName: {
    type: String,
    required: function () {
      return this.userType === 'Dealer';
    },
  },
  entityType: {
    type: String,
    required: function () {
      return this.userType === 'Dealer';
    },
  },
  primaryContactPerson: {
    type: String,
    required: function () {
      return this.userType === 'Dealer';
    },
  },
  primaryContactNumber: {
    type: String,
    required: function () {
      return this.userType === 'Dealer';
    },
  },
  secondaryContactPerson: {
    type: String,
    default: '',
  },
  secondaryContactNumber: {
    type: String,
    default: '',
  },

  password: {
    type: String,
    required: true,
  },
  addressList: [
    {
      type: String,
      required: true,
    }
  ],
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    required: true,
  },
  rejectionComment: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userschema);
