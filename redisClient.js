const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: 'redis', // Docker container name
    port: 6379
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log(' Redis is ready');
  }
}

module.exports = { redisClient, connectRedis };
