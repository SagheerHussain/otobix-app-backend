// constants.js

module.exports = {
    // App Config
    APP_NAME: 'Otobix',
    PORT: process.env.PORT || 3000,

    // User Roles
    USER_ROLES: {
        ADMIN: 'Admin',
        DEALER: 'Dealer',
        CUSTOMER: 'Customer',
        SALES_MANAGER: 'Sales Manager',
    },

    // Auction Statuses
    AUCTION_STATUS: {
        UPCOMING: 'upcoming',
        LIVE: 'live',
        OTOBUY: 'otobuy',
        MARKETPLACE: 'marketplace',
        LIVEAUCTIONENDED: 'liveAuctionEnded',
        OTOBUYENDED: 'otobuyEnded',
    },

    // Approval Statuses
    APPROVAL_STATUS: {
        APPROVED: 'Approved',
        REJECTED: 'Rejected',
        PENDING: 'Pending',
    },

    // Default Messages
    MESSAGES: {
        SERVER_ERROR: 'Something went wrong. Please try again later.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        NOT_FOUND: 'Resource not found.',
        VALIDATION_ERROR: 'Validation failed.',
        SUCCESS: 'Operation successful.',
    },

    // Regex Patterns
    REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^[0-9]{10,15}$/,
    },

    // API Response Keys
    RESPONSE: {
        SUCCESS: 'success',
        ERROR: 'error',
        MESSAGE: 'message',
        DATA: 'data',
    },
};
