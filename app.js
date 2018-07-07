if (process.env.ENV !== `production`) {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const translator = require('@noon/translator');
const prometheus = require('@noon/prometheus');
const log = require('@noon/logger').log(
  'socket_srv',
  process.env.LOG_HOST,
  process.env.LOG_PORT
);

const app = express();

// Needs to be the first middleware
app.use(prometheus.express.middleware);

app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// @noon/translator
app.use(
  translator(
    `${process.env.TRANSLATION_RPC_HOST}`,
    `${process.env.TRANSLATION_RPC_PORT}`
  )
);

// swagger definition
const swaggerDefinition = {
  info: {
    title: 'Noon Swagger API (Socket Service)',
    version: '0.1',
    description: 'Socket Microservice API Definition'
  },
  host: `localhost: ${process.env.PORT}`,
  basePath: '/'
};

// options for the swagger docs
const options = {
  swaggerDefinition: swaggerDefinition,
  apis: ['./routes/*.js']
};

// initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

app.set('swaggerSpec', swaggerSpec);
// serve swagger
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./routes/index');

app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).send({
    success: false,
    message: 'error.notFound.ar',
    type: 'Socket Srv',
    action: `${req.method} ${req.originalUrl}`,
    data: [],
    meta: {}
  });
});

app.use((err, req, res, next) => {
  if (err && err.status === 520) {
    return next();
  }
  log.error(
    {
      type: 'uncaughtException',
      err: err
    },
    'Socket uncaughtException'
  );
  res.status(520).send({
    success: false,
    message: 'somethingWentWrong',
    type: 'Socket Srv',
    action: 'uncaughtException'
  });
});

module.exports = app;
