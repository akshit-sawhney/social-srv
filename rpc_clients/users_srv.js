const teade = require('teade');

const client = new teade.Client(
  `${process.env.AUTH_RPC_HOST}`,
  `${process.env.AUTH_RPC_PORT}`
);

function authenticate(token, cb) {
  client.request(
    'authenticate',
    {
      token: token,
      getTeacherProfile: true
    },
    (err, response) => cb(err, response)
  );
}
exports.authenticateRpc = authenticate;
