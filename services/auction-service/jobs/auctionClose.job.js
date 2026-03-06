const cron = require('node-cron')
const Auction = require('../models/auction.model')
const Transaction = require('../models/transaction.model')

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date()

    // Activate upcoming auctions
    const activated = await Auction.updateMany(
      { status: 'upcoming', startTime: { $lte: now } },
      { $set: { status: 'active' } }
    )
    if (activated.modifiedCount > 0) {
      console.log(`Cron: Activated ${activated.modifiedCount} auction(s)`)
    }

    // Close expired auctions
    const expiredAuctions = await Auction.find({ status: 'active', endTime: { $lte: now } })

    for (const auction of expiredAuctions) {
      // Update auction status to ended
      await Auction.findByIdAndUpdate(auction._id, {
        status: 'ended',
        winner: auction.currentBidder || null
      })
      console.log(`Cron: Closed auction "${auction.title}" | Winner: ${auction.currentBidder || 'No bids'}`)

      // Save transaction ONLY if there was a winner (someone placed a bid)
      if (auction.currentBidder) {
        const transaction = await Transaction.create({
          auctionId: auction._id,
          auctionTitle: auction.title,
          finalPrice: auction.currentBid,
          winnerId: auction.currentBidder,
          sellerId: auction.createdBy
        })
        console.log(`Cron: Transaction saved for "${auction.title}" | Final Price: ${auction.currentBid}`)
      } else {
        console.log(`Cron: No transaction for "${auction.title}" — no bids placed`)
      }
    }

  } catch (error) {
    console.error('Cron job error:', error)
  }
})

console.log('Auction cron jobs scheduled (every minute)')