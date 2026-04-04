const { Worker } = require('bullmq');
const axios = require('axios');
const redisConnection = require('./redis');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

async function getUserInfo(userId) {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/user/${userId}`);
    return response.data;
  } catch (err) {
    console.error(`[Worker] Failed to fetch user info for ${userId}:`, err.message);
    return null;
  }
}

function startWorker(io) {
  const worker = new Worker(
    'notification-queue',
    async (job) => {
      console.log(`[Worker] Received job: "${job.name}"`, job.data);

      // ── outbid-notification ──────────────────────────────
      if (job.name === 'outbid-notification') {
        const { userId, auctionId, newHighestBid } = job.data;

        // Broadcast new highest bid to everyone watching
        io.to(`auction_${auctionId}`).emit('new_bid', {
          auctionId,
          amount: newHighestBid,
          userId: userId,           // ← added for live feed
          createdAt: new Date(),    // ← added for live feed timestamp
          message: `New highest bid: Rs.${newHighestBid}`
        });
        console.log(`[Worker] Broadcasted new_bid to room auction_${auctionId}`);

        // Send outbid alert to the user who got outbid
        io.to(`auction_${auctionId}`).emit('outbid_alert', {
          targetUserId: userId,
          auctionId,
          newHighestBid,
          message: `You have been outbid! New highest bid is Rs.${newHighestBid}`
        });
        console.log(`[Worker] Sent outbid_alert to user ${userId} in auction ${auctionId}`);
      }

      // ── auction_ending_soon ──────────────────────────────
      else if (job.name === 'auction_ending_soon') {
        const { auctionId, minutesLeft } = job.data;

        io.to(`auction_${auctionId}`).emit('auction_ending_soon', {
          auctionId,
          message: `Auction ending in ${minutesLeft} minutes! Place your bid now.`
        });
        console.log(`[Worker] Sent auction_ending_soon to room auction_${auctionId}`);
      }

      // ── auction_ended ────────────────────────────────────
      else if (job.name === 'auction_ended') {
        const { auctionId, winnerId, sellerId, finalPrice, auctionTitle } = job.data;

        console.log(`[Worker] Fetching winner and seller info...`)

        const [winnerInfo, sellerInfo] = await Promise.all([
          getUserInfo(winnerId),
          getUserInfo(sellerId)
        ]);

        console.log(`[Worker] Winner info:`, winnerInfo?.name)
        console.log(`[Worker] Seller info:`, sellerInfo?.name)

        // Notify winner
        io.to(`auction_${auctionId}`).emit('auction_won', {
          targetUserId: winnerId,
          auctionId,
          auctionTitle,
          finalPrice,
          message: `Congratulations! You won "${auctionTitle}" for Rs.${finalPrice}!`,
          sellerInfo: sellerInfo ? {
            name: sellerInfo.name,
            email: sellerInfo.email,
            phone: sellerInfo.phone,
            city: sellerInfo.city
          } : null
        });

        // Notify seller
        io.to(`auction_${auctionId}`).emit('auction_sold', {
          targetUserId: sellerId,
          auctionId,
          auctionTitle,
          finalPrice,
          message: `Your auction "${auctionTitle}" sold for Rs.${finalPrice}!`,
          winnerInfo: winnerInfo ? {
            name: winnerInfo.name,
            email: winnerInfo.email,
            phone: winnerInfo.phone,
            city: winnerInfo.city
          } : null
        });

        console.log(`[Worker] Sent auction_won to winner ${winnerId} and auction_sold to seller ${sellerId}`);
      }

      else {
        console.log(`[Worker] Unknown job name: ${job.name}`);
      }
    },
    {
      connection: redisConnection
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job "${job.name}" (id: ${job.id}) completed ✅`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job "${job.name}" (id: ${job.id}) failed ❌:`, err.message);
  });

  console.log('[Worker] BullMQ worker started - listening on "notification-queue"...');
}

module.exports = { startWorker };