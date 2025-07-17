const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    userRole: {
        type: String,
        enum: ['Dealer', 'customer', 'sales manager', 'admin'],
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },

    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        sparse: true,
        // unique: true,
    },

    // Dealer-only fields
    dealershipName: {
        type: String,
        required: function () {
            return this.userRole === 'Dealer';
        },
    },
    image: {
        type: String,
        default: '',
    },
    entityType: {
        type: String,
        required: function () {
            return this.userRole === 'Dealer';
        },
    },
    primaryContactPerson: {
        type: String,
        required: function () {
            return this.userRole === 'Dealer';
        },
    },
    primaryContactNumber: {
        type: String,
        required: function () {
            return this.userRole === 'Dealer';
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
