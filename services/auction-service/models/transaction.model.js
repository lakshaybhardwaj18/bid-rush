// ============================================================
// transaction.model.js — Transaction Schema
// Saved automatically when an auction ends via cron job
// ============================================================

const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  // Which auction this transaction belongs to
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Title of the auction item
  auctionTitle: {
    type: String,
    required: true
  },

  // Final winning bid amount
  finalPrice: {
    type: Number,
    required: true
  },

  // userId of the winner (highest bidder)
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // userId of the seller (who created auction)
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Transaction', transactionSchema)