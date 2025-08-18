// controllers/auctionController.js
const CarModel = require('../Models/carModel');
const SocketService = require('../Config/socket_service');
const CONSTANTS = require('../Utils/constants');
const EVENTS = require('../Sockets/socket_events');
const BidModel = require('../Models/bidModel');
const AutoBidModelForLiveSection = require('../Models/autoBidModelForLiveSection');
const UserModel = require('../Models/userModel');
// ---- tiny per-process lock (serialize all writes per car) ----
const __carLocks = new Map(); // carId -> Promise chain
async function withCarLock(carId, fn) {
    const prev = __carLocks.get(carId) || Promise.resolve();
    let release;
    const p = new Promise((res) => (release = res));
    __carLocks.set(carId, prev.then(() => p));
    try {
        return await fn();
    } finally {
        release();
        if (__carLocks.get(carId) === p) __carLocks.delete(carId);
    }
}

const isLive = (status) =>
    (status || '').toString().toLowerCase() === (CONSTANTS.AUCTION_STATUS.LIVE || 'live').toLowerCase();

// ========== PUBLIC: manual bid ==========
async function updateBid(req, res) {
    try {
        const { carId, newBidAmount, userId } = req.body;
        if (!carId || !newBidAmount || !userId)
            return res.status(400).json({ error: 'carId, newBidAmount and userId are required' });

        const car = await CarModel.findById(carId).select('highestBid highestBidder auctionStatus');
        if (!car) return res.status(404).json({ error: 'Car not found' });
        if (!isLive(car.auctionStatus)) return res.status(400).json({ error: 'Auction not live' });

        const current = Number(car.highestBid) || 0;
        const incoming = Number(newBidAmount);
        if (incoming <= current)
            return res.status(403).json({ error: 'Bid must be higher than current highest bid.' });

        // CAS write
        const updated = await CarModel.findOneAndUpdate(
            { _id: carId, highestBid: current, auctionStatus: car.auctionStatus },
            { $set: { highestBid: incoming, highestBidder: userId } },
            { new: true }
        );
        if (!updated) return res.status(409).json({ error: 'Race condition: please retry' });

        // ✅ Add car to user's my bids list
        await UserModel.updateOne(
            { _id: userId },
            { $addToSet: { myBids: carId } }
        );
        SocketService.emitToRoom(`${EVENTS.USER_ROOM}${userId}`, EVENTS.MY_BIDS_UPDATED, {
            action: 'add',
            carId: carId,
        });



        await BidModel.create({ carId, userId, bidAmount: incoming, time: new Date(), via: 'manual' });

        SocketService.broadcast(EVENTS.BID_UPDATED, { carId, highestBid: incoming, userId, via: 'manual' });
        SocketService.emitToRoom(`car-${carId}`, EVENTS.BID_UPDATED, { carId, highestBid: incoming, userId, via: 'manual' });

        // Resolve auto-bid wars
        await withCarLock(carId, async () => {
            await runAutoBidEngine(carId);
        });

        return res.json({ success: true, highestBid: updated.highestBid });
    } catch (error) {
        console.error('Error updating bid:', error);
        res.status(500).json({ error: 'Failed to update bid' });
    }
}

// ========== PUBLIC: submit / update auto-bid ==========
async function submitAutoBidForLiveSection(req, res) {
    try {
        const { carId, userId, autoBidAmount, increment } = req.body;
        if (!carId || !userId || autoBidAmount == null)
            return res.status(400).json({ error: 'carId, userId, and autoBidAmount are required' });

        const userMax = Number(autoBidAmount);
        const step = Number.isFinite(Number(increment)) && Number(increment) > 0 ? Math.floor(Number(increment)) : 1000;

        const car = await CarModel.findById(carId).select('highestBid highestBidder auctionStatus');
        if (!car) return res.status(404).json({ error: 'Car not found' });
        if (!isLive(car.auctionStatus)) return res.status(400).json({ error: 'Auction not live' });

        const current = Number(car.highestBid) || 0;
        const minAcceptable = current + step;
        if (!Number.isFinite(userMax) || userMax < minAcceptable) {
            return res.status(400).json({ error: `Auto-bid must be at least ₹${minAcceptable.toLocaleString('en-IN')}` });
        }

        const autobid = await AutoBidModelForLiveSection.findOneAndUpdate(
            { carId, userId },
            { $set: { maxAmount: userMax, increment: step, isActive: true }, $setOnInsert: { carId, userId } },
            { new: true, upsert: true }
        );

        // Optional immediate nudge by one step (don’t outbid yourself)
        await withCarLock(carId, async () => {
            const fresh = await CarModel.findById(carId).select('highestBid highestBidder auctionStatus');
            if (!fresh || !isLive(fresh.auctionStatus)) return;

            const latestPrice = Number(fresh.highestBid) || 0;
            const canOutbidNow =
                latestPrice + step <= userMax &&
                (!fresh.highestBidder || fresh.highestBidder.toString() !== userId.toString());
            if (!canOutbidNow) return;

            const nextAmount = Math.min(userMax, latestPrice + step);

            const updated = await CarModel.findOneAndUpdate(
                { _id: carId, highestBid: latestPrice, auctionStatus: fresh.auctionStatus },
                { $set: { highestBid: nextAmount, highestBidder: userId } },
                { new: true }
            );
            if (!updated) return;

            await BidModel.create({ carId, userId, bidAmount: nextAmount, time: new Date(), via: 'auto' });

            SocketService.broadcast(EVENTS.BID_UPDATED, { carId, highestBid: nextAmount, userId, via: 'auto' });
            SocketService.emitToRoom(`car-${carId}`, EVENTS.BID_UPDATED, { carId, highestBid: nextAmount, userId, via: 'auto' });
        });

        return res.json({ success: true, message: 'Auto-bid saved', autobid });
    } catch (error) {
        console.error('Error in submitAutoBidForLiveSection:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

// ========== PRIVATE: proxy engine ==========
async function runAutoBidEngine(carId) {
    let car = await CarModel.findById(carId).select('highestBid highestBidder auctionStatus');
    if (!car || !isLive(car.auctionStatus)) return;

    const current = Number(car.highestBid) || 0;
    const currentHighestBidder = car.highestBidder ? car.highestBidder.toString() : null;

    const autoBids = await AutoBidModelForLiveSection.find({
        carId,
        isActive: true,
        maxAmount: { $gt: current }
    }).lean();
    if (!autoBids.length) return;

    const contenders = autoBids.filter(
        ab => !currentHighestBidder || ab.userId.toString() !== currentHighestBidder
    );
    if (!contenders.length) return;

    contenders.forEach(c => { c.increment = Number(c.increment) > 0 ? Math.floor(Number(c.increment)) : 1000; });

    // Sort: higher max first; earlier created wins tie
    contenders.sort((a, b) => {
        if (b.maxAmount !== a.maxAmount) return b.maxAmount - a.maxAmount;
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const top = contenders[0];
    const second = contenders[1] || null;
    const step = top.increment || 1000;

    let target;
    if (!second) {
        target = Math.min(top.maxAmount, current + step);
    } else {
        target = Math.min(top.maxAmount, Math.max(current, second.maxAmount) + step);
    }
    if (!(target > current)) return;

    const updated = await CarModel.findOneAndUpdate(
        { _id: carId, highestBid: current, auctionStatus: car.auctionStatus },
        { $set: { highestBid: target, highestBidder: top.userId } },
        { new: true }
    );
    if (!updated) {
        // concurrent write → re-run once
        return runAutoBidEngine(carId);
    }

    await BidModel.create({ carId, userId: top.userId, bidAmount: target, time: new Date(), via: 'auto' });

    SocketService.broadcast(EVENTS.BID_UPDATED, { carId, highestBid: target, userId: top.userId, via: 'auto' });
    SocketService.emitToRoom(`car-${carId}`, EVENTS.BID_UPDATED, { carId, highestBid: target, userId: top.userId, via: 'auto' });

    const stillPossible = await AutoBidModelForLiveSection.exists({
        carId,
        isActive: true,
        maxAmount: { $gt: target }
    });
    if (stillPossible) return runAutoBidEngine(carId);
}

// ========== PUBLIC: utility for Agenda job ==========
async function deactivateAutoBidsForCar(carId) {
    await AutoBidModelForLiveSection.updateMany(
        { carId, isActive: true },
        { $set: { isActive: false } }
    );
}

module.exports = {
    updateBid,
    submitAutoBidForLiveSection,
    deactivateAutoBidsForCar, // use in agenda “end auction”
};
