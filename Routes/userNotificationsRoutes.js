// routes/notifications.js
const router = require('express').Router();
const { createNotification, notificationsList, notificationDetails, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } = require('../Controllers/user_notifications_controller');

router.post('/create-notification', createNotification);
router.get('/notifications-list', notificationsList);
router.get('/notification-details', notificationDetails);
router.post('/mark-notification-as-read', markNotificationAsRead);
router.post('/mark-all-notifications-as-read', markAllNotificationsAsRead);
router.get('/get-unread-notifications-count', getUnreadNotificationsCount);


module.exports = router;
