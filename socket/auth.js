const usersRpc = require('../rpc_clients/users_srv');
const rolesConst = require('../constants/roles');
const clients = require('./clients');

module.exports = (ioServer, socket, serverId, next) => {
  const query = socket.request._query;
  if (!query.token) {
    next(new Error('No Token'));
  } else {
    usersRpc.authenticateRpc(query.token, (err, response) => {
      if (err) {
        next(new Error('Authentication error'));
      } else {
        if (response.user.roles.indexOf(rolesConst.student) > -1) {
          query.role = 'student';
        } else if (response.user.roles.indexOf(rolesConst.teacher) > -1) {
          query.role = 'teacher';
        } else {
          return next(new Error('No Permission'));
        }
        const obj = {
          role: query.role,
          userId: response.user.id,
          socketId: socket.id,
          name: response.user.name,
          gender: response.user.gender,
          city: response.user.city,
          profile_pic: response.user.profile_pic,
          rating_total: response.user.rating_total,
          rating_count: response.user.rating_count,
          degree: response.user.degree,
          major: response.user.major,
          college: response.user.college,
          interest: response.user.interest,
          about_me: response.user.about_me,
          status: query.status || 'online',
          tutoringSessionId: query.tutoringSessionId || 0,
          authenticated: true
        };
        clients.addOrUpdate(obj, clientAddOrUpdateError => {
          if (clientAddOrUpdateError) {
            next(clientAddOrUpdateError);
          } else {
            next();
          }
        });
      }
    });
  }
};
