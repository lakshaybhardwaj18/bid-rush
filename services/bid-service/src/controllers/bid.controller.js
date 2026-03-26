const Bid = require('../models/bid.model');
const Redis = require('ioredis');
const axios = require('axios');
const mongoose = require('mongoose');
const { Queue } = require('bullmq');
// ── Redis connection ──────────────────────────────
const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
});
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));
// ── BullMQ notification queue ─────────────────────
// Instead of calling Member 4 directly, we push a job to this queue
// Member 4 will listen to this queue and process notifications
const notificationQueue = new Queue('notification-queue', {
    connection: new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null
    })
});
// ── Separate connection to auction-db ─────────────
const auctionConn = mongoose.createConnection(
    process.env.AUCTION_DB_URI
);
const Auction = auctionConn.model(
    'Auction',
    new mongoose.Schema({}, { strict: false }),
);

// ═══════════════════════════════════════════════════
// PLACE A BID
// POST /api/bids/place
// Body: { auctionId, amount }
// ═══════════════════════════════════════════════════
const placeBid = async (req, res) => {
    const { auctionId, amount } = req.body;
    const userId = req.user.userId;

    // ── Validate inputs ────────────────────────────
    if (!auctionId || amount === undefined) {
        return res.status(400).json({ message: 'Both auctionId and amount are required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // ── Redis Distributed Lock ─────────────────────
    // NX = only set if key doesn't exist (lock)
    // PX = auto expire after 5000ms (safety unlock)
    // This ensures only ONE bid processes at a time per auction
    const lockKey = `lock:auction:${auctionId}`;
    const lockValue = `${userId}-${Date.now()}`;
    const lock = await redis.set(lockKey, lockValue, 'NX', 'PX', 5000);

    if (!lock) {
        return res.status(429).json({ message: 'Another bid is being processed. Please try again.' });
    }

    try {
        // ── Check auction exists and is active ────────
        let auction;
        try {
            auction = await Auction.findById(auctionId);
            if (!auction) {
                return res.status(404).json({ message: 'Auction not found.' });
            }
        } catch (err) {
            return res.status(404).json({ message: 'Auction not found.' });
        }

        if (auction.status !== 'active') {
            return res.status(400).json({ message: 'This auction is not currently accepting bids.' });
        }

        // ── Check against current highest bid from Redis ──
        const redisKey = `auction:${auctionId}:highestBid`;
        const currentHighestStr = await redis.get(redisKey);
        const currentHighest = currentHighestStr ? parseFloat(currentHighestStr) : 0;

        if (amount <= currentHighest) {
            return res.status(400).json({
                message: `Your bid of Rs.${amount} must be higher than the current highest bid of Rs.${currentHighest}.`
            });
        }
        // ── MongoDB Transaction ────────────────────────
        // Ensures both operations succeed or both fail together
        const session = await mongoose.startSession();
        session.startTransaction();
        let newBid;
        try {
            // Mark previous active bids as outbid
            const previousHighestBid = await Bid.findOne({ auctionId, status: 'active' }).session(session);

            await Bid.updateMany(
                { auctionId, status: 'active' },
                { $set: { status: 'outbid' } },
                { session }
            );

            // Save new bid
            newBid = new Bid({ auctionId, userId, amount, status: 'active' });
            await newBid.save({ session });

            await session.commitTransaction();
            session.endSession();

            // ── Update Redis cache with new highest bid ──
            await redis.set(redisKey, amount.toString());

            // ── Update auction service ───────────────────
            try {
                await axios.put(
                    `${process.env.AUCTION_SERVICE_URL}/api/auctions/${auctionId}/bid`,
                    { currentBid: amount, currentBidder: userId },
                    { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
                );
            } catch (err) {
                console.error(' Could not update auction service:', err.message);
            }

            // ── Push BullMQ job instead of calling Member 4 directly ──
            if (previousHighestBid && previousHighestBid.userId !== userId) {
                await notificationQueue.add('outbid-notification', {
                    userId: previousHighestBid.userId,
                    auctionId: auctionId,
                    newHighestBid: amount,
                });
                console.log('Notification job pushed to queue');
            }

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

        return res.status(201).json({
            message: 'Bid placed successfully!',
            bid: newBid,
        });

    } catch (err) {
        console.error('placeBid error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    } finally {
        // ── Always release the lock when done ─────────
        const currentLock = await redis.get(lockKey);
        if (currentLock === lockValue) {
            await redis.del(lockKey);
        }
    }
};

// ═══════════════════════════════════════════════════
// GET ALL BIDS FOR AN AUCTION
// GET /api/bids/auction/:auctionId
// ═══════════════════════════════════════════════════
const getBidsByAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const bids = await Bid.find({ auctionId }).sort({ amount: -1 });
        return res.status(200).json({ count: bids.length, bids });
    } catch (err) {
        console.error('getBidsByAuction error:', err.message);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// ═══════════════════════════════════════════════════
// GET HIGHEST BID FOR AN AUCTION
// GET /api/bids/highest/:auctionId
// ═══════════════════════════════════════════════════
const getHighestBid = async (req, res) => {
    try {
        const { auctionId } = req.params;

        const redisKey = `auction:${auctionId}:highestBid`;
        const cachedHighest = await redis.get(redisKey);

        if (cachedHighest) {
            return res.status(200).json({
                auctionId,
                highestBid: parseFloat(cachedHighest),
                source: 'cache'
            });
        }

        const highestBid = await Bid.findOne({ auctionId }).sort({ amount: -1 });

        if (!highestBid) {
            return res.status(200).json({ auctionId, highestBid: 0, message: 'No bids yet.' });
        }

        await redis.set(redisKey, highestBid.amount.toString());

        return res.status(200).json({
            auctionId,
            highestBid: highestBid.amount,
            source: 'database'
        });

    } catch (err) {
        console.error('getHighestBid error:', err.message);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// ═══════════════════════════════════════════════════
// GET ALL BIDS BY LOGGED-IN USER
// GET /api/bids/my-bids
// ═══════════════════════════════════════════════════
const getBidsByUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bids = await Bid.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ count: bids.length, bids });
    } catch (err) {
        console.error('getBidsByUser error:', err.message);
        return res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { placeBid, getBidsByAuction, getHighestBid, getBidsByUser };