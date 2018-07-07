const Redis = require('ioredis');
const _ = require('lodash');

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

exports.find = (socketId, cb) => {
  let getUser = null;
  redis
    .smembers('onlineusers')
    .then(members => {
      if (members.length !== 0) {
        for (let i = 0; i < members.length; i + 1) {
          const memArr = members[i].trim().split(':');
          if (memArr[memArr.length - 2] === socketId) {
            return members[i];
          }
        }
      } else {
        return null;
      }
    })
    .then(member => {
      if (member === null) {
        return getUser;
      } else {
        return redis.hgetall(member);
      }
    })
    .then(retUser => {
      getUser = retUser;
      if (getUser) {
        getUser.userId = Number(getUser.userId);
        if (getUser.subjects) {
          getUser.subjects = getUser.subjects.split(',');
          for (const i in getUser.subjects) {
            getUser.subjects[i] = Number(getUser.subjects[i]);
          }
        }
      }
      return cb(null, getUser);
    })
    .catch(err => cb(err, null));
};

exports.addOrUpdate = (data, cb) => {
  if (!data.socketId && !data.userId) {
    return cb({ msg: 'param missing' });
  } else {
    redis
      .smembers('onlineusers')
      .then(members => {
        if (members.length !== 0) {
          let member = null;
          _.forEach(members, memberRow => {
            const memArr = memberRow.trim().split(':');
            if (memArr[memArr.length - 1] === data.userId) {
              member = memberRow;
            }
          });
          return member;
        }
        return null;
      })
      .then(member => {
        const newMember = `onlineusers: ${data.socketId} : ${data.userId}`;
        if (member) {
          return redis
            .multi()
            .srem('onlineusers', member)
            .sadd('onlineusers', newMember)
            .del(member)
            .hmset(newMember, data)
            .exec();
        } else {
          return redis
            .multi()
            .sadd('onlineusers', newMember)
            .hmset(newMember, data)
            .exec();
        }
      })
      .then(retUser => cb(null, retUser))
      .catch(err => cb(err, null));
  }
};
