const cron = require('node-cron')
const Auction = require('../models/auction.model')
const Transaction = require('../models/transaction.model')
const { Queue } = require('bullmq')
const Redis = require('ioredis')

// Connect to Redis for BullMQ
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

// Notification queue — Member 4 listens to this
const notificationQueue = new Queue('notification-queue', {
  connection: redisConnection
})

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

    // Check for auctions ending soon (less than 5 minutes left)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    const endingSoonAuctions = await Auction.find({
      status: 'active',
      endTime: { $gt: now, $lte: fiveMinutesFromNow },
      endingSoonNotified: { $ne: true }
    })
    for (const auction of endingSoonAuctions) {
      await notificationQueue.add('auction_ending_soon', {
        auctionId: auction._id.toString(),
        minutesLeft: 5
      })
      await Auction.findByIdAndUpdate(auction._id, { endingSoonNotified: true })
      console.log(`Cron: Sent ending soon notification for "${auction.title}"`)
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
        await Transaction.create({
          auctionId: auction._id,
          auctionTitle: auction.title,
          finalPrice: auction.currentBid,
          winnerId: auction.currentBidder,
          sellerId: auction.createdBy
        })
        console.log(`Cron: Transaction saved for "${auction.title}" | Final Price: ${auction.currentBid}`)

        // Push BullMQ job to notify winner and seller via Member 4
        await notificationQueue.add('auction_ended', {
          auctionId: auction._id.toString(),
          winnerId: auction.currentBidder.toString(),
          sellerId: auction.createdBy.toString(),
          finalPrice: auction.currentBid,
          auctionTitle: auction.title
        })
        console.log(`Cron: Pushed auction_ended notification job for "${auction.title}"`)

      } else {
        console.log(`Cron: No transaction for "${auction.title}" — no bids placed`)
      }
    }
  } catch (error) {
    console.error('Cron job error:', error)
  }
})

console.log('Auction cron jobs scheduled (every minute)')
