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
      unique: true,
  },
  dealershipName: {
      type: String,
      required: true,
  },
  entityType: {
      type: String,
      required: true,
  },
  primaryContactPerson: {
      type: String,
      required: true,
  },
  primaryContactNumber: {
      type: String,
      required: true,
  },
  secondaryContactPerson: {
      type: String,
  },
  secondaryContactNumber: {
      type: String,
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
