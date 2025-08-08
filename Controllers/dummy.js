const CarDetails = require('../Models/carModel'); // Adjust path if needed

exports.dummyFunctionForNow = async function (req, res) {
    try {
        const result = await CarDetails.updateMany(
            {
                defaultAuctionTime: { $exists: true },
                auctionStatus: 'live'
            },
            {
                $unset: { defaultAuctionTime: "" },
                $set: { auctionStatus: 'live' }
            }
        );

        console.log(`✅ Cleaned and updated ${result.modifiedCount} documents.`);
        res.json({
            success: true,
            message: `Cleaned and updated ${result.modifiedCount} documents.`
        });
    } catch (error) {
        console.error('❌ Failed to clean auction fields:', error);
        res.status(500).json({ error: 'Failed to clean auction fields' });
    }
};
