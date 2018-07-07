const express = require('express');
const teade = require('teade');
const Promise = require('bluebird');

const router = express.Router();

router.get('/', (req, res) =>
  res.status(200).send({
    success: null,
    message: '',
    type: 'Socket',
    action: 'Index',
    id: null,
    data: [
      'Hi I am Noon Socket Service. To check what i can offer please explore'
    ]
  })
);

/**
 * @swagger
 * /socket/v1/:
 *   get:
 *     tags:
 *       - Index
 *     description: Get Index
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Get Index
 */
router.get('/socket/v1/', (req, res) => {
  const addressProxy = req.headers['x-forwarded-for'];
  const normalAddress = req.connection.remoteAddress;
  return res.status(200).send({
    success: true,
    message: '',
    type: 'socket',
    action: 'Index',
    id: null,
    data: [
      'Hi I am Noon Socket Service. This is test route!',
      addressProxy,
      normalAddress
    ]
  });
});

function testRPCs(srv) {
  return new Promise(resolve => {
    if (!process.env[`${srv}_RPC_HOST`] || !process.env[`${srv}_RPC_PORT`]) {
      return resolve({
        service_name: srv,
        success: false,
        msg: 'no host and port defined'
      });
    }
    const client = new teade.Client(
      process.env[`${srv}_RPC_HOST`],
      process.env[`${srv}_RPC_PORT`]
    );
    client.request('rpcTest', {}, (err, response) => {
      if (response && response.success) {
        resolve({ service_name: srv, success: true });
      } else {
        resolve({ service_name: srv, success: false, err: err.toString() });
      }
    });
  });
}

/**
 * @swagger
 * /socket/v1/rpcTest:
 *   get:
 *     tags:
 *       - Index
 *     description: Get rpcTest
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Get rpcTest
 */
router.get('/socket/v1/rpcTest', (req, res) => {
  const arr = [
    testRPCs('ELASTIC'),
    testRPCs('FLASHCARD'),
    testRPCs('FOLDER'),
    testRPCs('NOTIFICATION'),
    testRPCs('TRANSLATION'),
    testRPCs('PACKAGE'),
    testRPCs('QUESTION'),
    testRPCs('AUTH'),
    testRPCs('PERM'),
    testRPCs('BILLING')
  ];

  Promise.all(arr).then(results => {
    res.status(200).send({
      success: true,
      message: '',
      type: 'socket',
      action: 'rpcTest',
      id: null,
      data: results
    });
  });
});

module.exports = router;
