const mongoose = require('mongoose');
const CONSTANTS = require('../Utils/constants');

const userschema = new mongoose.Schema({
    userRole: {
        type: String,
        enum: [CONSTANTS.USER_ROLES.DEALER, CONSTANTS.USER_ROLES.CUSTOMER, CONSTANTS.USER_ROLES.SALES_MANAGER, CONSTANTS.USER_ROLES.ADMIN],
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
            return this.userRole === CONSTANTS.USER_ROLES.DEALER;
        },
    },
    image: {
        type: String,
        default: '',
    },
    entityType: {
        type: String,
        required: function () {
            return this.userRole === CONSTANTS.USER_ROLES.DEALER;
        },
    },
    primaryContactPerson: {
        type: String,
        required: function () {
            return this.userRole === CONSTANTS.USER_ROLES.DEALER;
        },
    },
    primaryContactNumber: {
        type: String,
        required: function () {
            return this.userRole === CONSTANTS.USER_ROLES.DEALER;
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
        enum: [CONSTANTS.APPROVAL_STATUS.PENDING, CONSTANTS.APPROVAL_STATUS.APPROVED, CONSTANTS.APPROVAL_STATUS.REJECTED],
        default: CONSTANTS.APPROVAL_STATUS.PENDING,
        required: true,
    },
    rejectionComment: {
        type: String,
        default: '',
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userschema);
