const SocketRedis = require('socket.io-redis');
const Redis = require('ioredis');

const sub = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);
const pub = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

const adapter = new SocketRedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  pubClient: pub,
  subClient: sub,
  requestsTimeout: 5000
});

module.exports = {
  adapter: adapter,
  pub: pub,
  sub: sub
};
