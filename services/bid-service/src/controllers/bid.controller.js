const Bid = require('../models/bid.model');
const Redis = require('ioredis');
const axios = require('axios');
const mongoose = require('mongoose');

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

// Separate connection to auction-db to validate auctions
const auctionConn = mongoose.createConnection(
  process.env.MONGO_URI.replace('bid-db', 'auction-db')
);
const Auction = auctionConn.model(
  'Auction',
  new mongoose.Schema({}, { strict: false }),
  'auctions'
);

// ═══════════════════════════════════════════════════
// PLACE A BID
// POST /api/bids/place
// Body: { auctionId, amount }
// ═══════════════════════════════════════════════════
const placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!auctionId || amount === undefined) {
      return res.status(400).json({ message: 'Both auctionId and amount are required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // Check auction exists and is active directly from auction-db
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

    // Check against current highest bid from Redis
    const redisKey = `auction:${auctionId}:highestBid`;
    const currentHighestStr = await redis.get(redisKey);
    const currentHighest = currentHighestStr ? parseFloat(currentHighestStr) : 0;

    if (amount <= currentHighest) {
      return res.status(400).json({
        message: `Your bid of $${amount} must be higher than the current highest bid of $${currentHighest}.`
      });
    }

    // Get previous highest bidder before updating
    const previousHighestBid = await Bid.findOne({ auctionId, status: 'active' });

    // Mark all previous active bids as outbid
    await Bid.updateMany(
      { auctionId, status: 'active' },
      { $set: { status: 'outbid' } }
    );

    // Save new bid to MongoDB
    const newBid = new Bid({ auctionId, userId, amount, status: 'active' });
    await newBid.save();

    // Update Redis with new highest bid
    await redis.set(redisKey, amount.toString());

    // Update auction's currentBid and currentBidder (calls Member 2's service)
    try {
      await axios.put(
        `${process.env.AUCTION_SERVICE_URL}/api/auctions/${auctionId}/bid`,
        { currentBid: amount, currentBidder: userId },
        { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
      );
    } catch (err) {
      console.error('⚠️ Could not update auction service:', err.message);
    }

    // Notify previously highest bidder they got outbid (calls Member 4's service)
    if (previousHighestBid && previousHighestBid.userId !== userId) {
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/outbid`,
          {
            userId: previousHighestBid.userId,
            auctionId: auctionId,
            newHighestBid: amount,
          }
        );
      } catch (err) {
        console.error('⚠️ Notification service unreachable:', err.message);
      }
    }

    return res.status(201).json({
      message: 'Bid placed successfully!',
      bid: newBid,
    });

  } catch (err) {
    console.error('placeBid error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
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

    // Try Redis first
    const redisKey = `auction:${auctionId}:highestBid`;
    const cachedHighest = await redis.get(redisKey);

    if (cachedHighest) {
      return res.status(200).json({
        auctionId,
        highestBid: parseFloat(cachedHighest),
        source: 'cache'
      });
    }

    // Fallback to MongoDB
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