// ============================================================
// auctionClose.job.js — Runs every minute to manage auction status
// Uses node-cron (like a scheduled alarm clock for the server)
//
// Job 1: "upcoming" → "active"  when startTime arrives
// Job 2: "active"   → "ended"   when endTime passes
// ============================================================

const cron = require('node-cron')
const Auction = require('../models/auction.model')

// Runs every minute: '* * * * *'
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date()

    // Activate auctions whose startTime has passed
    const activated = await Auction.updateMany(
      { status: 'upcoming', startTime: { $lte: now } },
      { $set: { status: 'active' } }
    )
    if (activated.modifiedCount > 0) {
      console.log(`Cron: Activated ${activated.modifiedCount} auction(s)`)
    }

    // Close auctions whose endTime has passed
    const expiredAuctions = await Auction.find({ status: 'active', endTime: { $lte: now } })

    for (const auction of expiredAuctions) {
      await Auction.findByIdAndUpdate(auction._id, {
        status: 'ended',
        winner: auction.currentBidder || null
      })
      console.log(`Cron: Closed auction "${auction.title}" | Winner: ${auction.currentBidder || 'No bids'}`)
    }

  } catch (error) {
    console.error('Cron job error:', error)
  }
})

console.log('Auction cron jobs scheduled (every minute)')
