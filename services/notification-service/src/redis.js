const Redis = require('ioredis');

// Connect to Upstash Redis using the URL from .env
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected to Upstash Redis successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

module.exports = redisConnection;
