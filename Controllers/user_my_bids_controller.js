const UserModel = require('../Models/userModel');
const SocketService = require('../Config/socket_service');
const EVENTS = require('../Sockets/socket_events');
const CONSTANTS = require('../Utils/constants');
const CarModel = require('../Models/carModel');

// Add to wishlist
exports.addToMyBids = async (req, res) => {
    try {
        const { userId, carId } = req.body;
        if (!userId || !carId) {
            return res.status(400).json({ error: 'userId and carId are required' });
        }

        const normalizedCarId = String(carId).trim();

        // $addToSet adds only if not already present (atomic, no duplicates)
        const result = await UserModel.updateOne(
            { _id: userId },
            { $addToSet: { myBids: normalizedCarId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const added = result.modifiedCount === 1; // false means it was already there

        // (optional) return the latest wishlist
        const { myBids } = await UserModel.findById(userId).select('myBids').lean();

        // 🔔 realtime push (only if DB actually changed)
        if (added) {
            SocketService.emitToRoom(`${EVENTS.USER_ROOM}${userId}`, EVENTS.MY_BIDS_UPDATED, {
                action: 'add',
                carId: normalizedCarId,
            });
        }

        return res.json({
            success: true,
            added,              // true if newly added, false if duplicate
            myBids,           // current wishlist array
        });
    } catch (err) {
        console.error('addToMyBids error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove from wishlist
exports.removeFromMyBids = async (req, res) => {
    try {
        const { userId, carId } = req.body;
        if (!userId || !carId) {
            return res.status(400).json({ error: 'userId and carId are required' });
        }

        const normalizedCarId = String(carId).trim();

        // $pull removes the value if it exists
        const result = await UserModel.updateOne(
            { _id: userId },
            { $pull: { myBids: normalizedCarId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const removed = result.modifiedCount === 1; // false means it wasn't in myBids

        // (optional) return updated myBids
        const { myBids } = await UserModel.findById(userId).select('myBids').lean();

        // 🔔 realtime push (only if DB actually changed)
        if (removed) {
            SocketService.emitToRoom(`${EVENTS.USER_ROOM}${userId}`, EVENTS.MY_BIDS_UPDATED, {
                action: 'remove',
                carId: normalizedCarId,
            });
        }

        return res.json({
            success: true,
            removed,            // true if removed, false if not found in myBids
            myBids,           // current myBids array
        });
    } catch (err) {
        console.error('removeFromMyBids error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


// Get myBids
exports.getUserMyBids = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await UserModel.findById(userId).select('myBids').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ myBids: user.myBids || [] });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get myBids cars list
exports.getUserMyBidsCarsList = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        // 1) Get myBids IDs from user
        const user = await UserModel.findById(userId).select('myBids').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const myBids = (user.myBids || []).map(String);
        if (myBids.length === 0) {
            return res.json({ success: true, myBidsCars: [] });
        }


        // 2) Fetch minimal fields + image fields needed to compute imageUrl
        const cars = await CarModel.find(
            { _id: { $in: myBids } },
            {
                _id: 1,
                make: 1,
                model: 1,
                variant: 1,
                priceDiscovery: 1,
                yearMonthOfManufacture: 1,
                odometerReadingInKms: 1,
                fuelType: 1,
                city: 1,
                approvalStatus: 1,
                frontMain: 1,
            }
        ).lean();


        const simplified = cars.map((car) => {
            return {
                id: String(car._id),
                imageUrl: Array.isArray(car.frontMain) ? (car.frontMain[0] || '') : (car.frontMain || ''),
                make: car.make ?? '',
                model: car.model ?? '',
                variant: car.variant ?? '',
                priceDiscovery: Number(car.priceDiscovery || 0),
                yearMonthOfManufacture: car.yearMonthOfManufacture
                    ?? null,
                odometerReadingInKms: Number(car.odometerReadingInKms || 0),
                fuelType: car.fuelType ?? '',
                inspectionLocation: car.city ?? '',
                isInspected: String(car.approvalStatus || '').toUpperCase() === 'APPROVED'
            };
        });

        // 3) Keep the same order as the myBids array, but latest first
        const order = new Map(myBids.map((id, i) => [id, i]));
        simplified.sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));


        return res.json({ success: true, myBidsCars: simplified });
    } catch (err) {
        console.error('getMyBidsCars error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

