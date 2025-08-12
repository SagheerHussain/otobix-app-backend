const UserModel = require('../Models/userModel');

exports.addToWishlist = async (req, res) => {
    try {
        const { userId, carId } = req.body;
        if (!userId || !carId) {
            return res.status(400).json({ error: 'userId and carId are required' });
        }

        const normalizedCarId = String(carId).trim();

        // $addToSet adds only if not already present (atomic, no duplicates)
        const result = await UserModel.updateOne(
            { _id: userId },
            { $addToSet: { wishlist: normalizedCarId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const added = result.modifiedCount === 1; // false means it was already there

        // (optional) return the latest wishlist
        const { wishlist } = await UserModel.findById(userId).select('wishlist').lean();

        return res.json({
            success: true,
            added,              // true if newly added, false if duplicate
            wishlist,           // current wishlist array
        });
    } catch (err) {
        console.error('addToWishlist error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
