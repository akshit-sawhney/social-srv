const prometheus = require('@noon/prometheus');
const uuid = require('uuid');
const SocketIOServer = require('socket.io');
const SocketIOSocket = require('socket.io/lib/socket');
const servers = require('./servers');
const redis = require('./redis');
const auth = require('./auth');

let ioServer;
let serverId;

prometheus.socketio.instrumentSocket(SocketIOSocket);

module.exports.run = (server, port) => {
  serverId = uuid.v4();
  servers.initialize(redis.pub, redis.sub, serverId);

  server.on('error', err => console.error(err));
  server.on('listening', () => {
    console.log(`yes: ${port}`);
  });

  ioServer = new SocketIOServer();
  ioServer.listen(server, {
    path: '/socket/v1/socket.io',
    pingInterval: 30000,
    pingTimeout: 60000
  });

  ioServer.adapter(redis.adapter);

  prometheus.socketio.instrumentServer(ioServer);

  ioServer.use((socket, next) => {
    auth(ioServer, socket, serverId, next);
  });

  ioServer.on('connection', socket => {
    const ack = (a, b) => console.log(a, b);
    ack(null, { success: true, msg: 'success' });

    socket.on('disconnecting', () => {
      console.log('Socket disconnecting');
    });

    socket.on('disconnect', () => {
      console.log(`socket has been disconnected`);
    });
  });
};

module.exports.ioServer = ioServer;
