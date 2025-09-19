const { createClient } = require('redis');

// const client = createClient({
//   socket: {
//     host: process.env.REDIS_HOST || 'redis',
//     port: process.env.REDIS_PORT || 6379
//   }
// });

const client = createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});


client.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = { client, connectRedis };
