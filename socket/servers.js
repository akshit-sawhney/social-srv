const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');

const HEARTBEAT = process.env.HEARTBEAT || 500;
const DEATH = process.env.DEATH || 3000;

let serverId;
let list;
let pub;
let sub;

const reconcile = data => {
  list = _(list)
    .concat(data)
    .uniqBy(server => server.id)
    .sortBy(server => server.id)
    .value();
};

// Removes servers that were last seen too long ago.
const trim = () => {
  const removed = _(list)
    .remove(server => moment.utc().valueOf() - server.lastSeen > DEATH)
    .value();
  _.each(removed, s => {
    console.log(`removed server with id ${s.id}`);
  });
};

// Delays heartbeat.
const delay = () => new Promise(resolve => setTimeout(resolve, HEARTBEAT));

// Publishes serverHeartbeat to Redis.
const publish = () => {
  Promise.try(() => {
    pub.publish(
      `serverHeartbeat`,
      JSON.stringify({
        id: serverId,
        lastSeen: moment.utc().valueOf()
      })
    );
  });
};

// Runs heartbeat continuously.
const cycle = () => {
  Promise.try(() => delay())
    .then(publish)
    .then(cycle);
};

// Updates server list with subscription data.
const update = data => {
  const s = _.find(list, server => server.id === data.id);
  if (s) {
    s.lastSeen = data.lastSeen;
  } else {
    const length = list.length;
    reconcile(data);
    if (length < list.length) {
      console.log(`added server with id ${data.id}`);
    }
  }
  trim();
};

// Starts basic server health/information service.
module.exports.initialize = (publisher, subscriber, serverIdParam) => {
  pub = publisher;
  sub = subscriber;
  list = [];
  serverId = serverIdParam;
  sub.subscribe('serverHeartbeat');
  sub.on('message', (chan, msg) => {
    if (chan === 'serverHeartbeat') {
      update(JSON.parse(msg));
    }
  });
  cycle();
};
