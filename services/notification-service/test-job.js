require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const q = new Queue('notification-queue', { connection: redis });
q.add('auction_ended', {
  auctionId: '69cfe7c4fa9dd0ba625e25be',
  winnerId: '69c9017989ccaf1cc207a18e',
  sellerId: '69c9027589ccaf1cc207a192',
  finalPrice: 21000,
  auctionTitle: 'Mobile'
}).then(() => { console.log('Job pushed!'); process.exit(); });