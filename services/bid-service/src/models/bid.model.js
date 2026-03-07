const mongoose = require('mongoose');
const bidSchema = new mongoose.Schema
({
    auctionId: {
      type: String,
      required: [true, 'Auction ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0.01, 'Bid must be greater than zero'],
    },
    status: {
      type: String,
      enum: ['active', 'outbid', 'won'],
      default: 'active',
    },
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model('Bid', bidSchema);