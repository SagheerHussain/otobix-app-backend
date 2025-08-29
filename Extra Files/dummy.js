const NotificationsModel = require('../Models/userNotificationsModel'); // Adjust path if needed

exports.dummyFunctionForNow = async function (req, res) {
    const { deletedCount } = await NotificationsModel.deleteMany({
        title: 'Test Notification',
    });
    return deletedCount; // number of docs removed
}



