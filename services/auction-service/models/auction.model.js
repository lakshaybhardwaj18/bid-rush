// ============================================================
// auction.model.js — Defines the Auction schema in MongoDB
// Follows same style as Member 1's user.model.js
// ============================================================

const mongoose = require('mongoose')

const auctionSchema = new mongoose.Schema({
  // Title of item being auctioned e.g. "iPhone 15 Pro"
  title: {
    type: String,
    required: true,
    trim: true
  },

  // Full description e.g. "Brand new, 256GB, unopened box"
  description: {
    type: String,
    required: true,
    trim: true
  },

  // Optional image URL
  image: {
    type: String,
    default: ''
  },

  // Category for filtering — must be one of these values
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Books', 'Sports', 'Other'],
    default: 'Other'
  },

  // Minimum starting bid set by seller
  startPrice: {
    type: Number,
    required: true
  },

  // Current highest bid — starts equal to startPrice, updates as bids come in
  // Member 3 (Bid Service) will update this field when a bid is placed
  currentBid: {
    type: Number,
    default: 0
  },

  // userId of whoever has the current highest bid
  // Updated by Member 3's Bid Service
  currentBidder: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // When auction opens for bidding
  startTime: {
    type: Date,
    required: true
  },

  // When auction closes — cron job checks this every minute
  endTime: {
    type: Date,
    required: true
  },

  // "upcoming" → not started yet
  // "active"   → accepting bids right now
  // "ended"    → closed, no more bids
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming'
  },

  // userId of the seller who created this auction
  // Comes from JWT token: req.user.userId (Member 1 stores userId in token)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Set when auction ends — whoever had highest bid wins
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Auction', auctionSchema)
