module.exports = {
    // Events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    BID_UPDATED: 'bid-updated',
    USER_TYPING: 'user-typing',
    AUCTION_ENDED: 'auction-ended',
    WISHLIST_UPDATED: 'wishlist-updated',
    MY_BIDS_UPDATED: 'my-bids-updated',
    LIVE_BIDS_SECTION_UPDATED: 'live-bids-section-updated',
    USER_NOTIFICATION_CREATED: 'user-notification-created',
    USER_NOTIFICATION_MARKED_AS_READ: 'user-notification-marked-as-read',
    USER_ALL_NOTIFICATIONS_MARKED_AS_READ: 'user-all-notifications-marked-as-read',
    AUCTION_TIMER_UPDATED: 'auction-timer-updated',
    UPDATED_ADMIN_HOME_USERS: 'updated-admin-home-users',

    // Rooms
    USER_ROOM: 'user-room:',
    LIVE_BIDS_SECTION_ROOM: 'live-bids-section-room:',
    USER_NOTIFICATIONS_ROOM: 'user-notifications-room:',
    AUCTION_TIMER_ROOM: 'auction-timer-room:',
    ADMIN_HOME_ROOM: 'admin-home-room:',
};
