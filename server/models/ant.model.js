'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');
const _ = require('lodash');
const Config = require('../../config');
const axios = require("axios");

const ASSET_TYPES = Config.get('/constants/ASSET_TYPES');
const COUNTRY_CODES = Config.get('/constants/COUNTRY_CODES');
const ANT_STATUS = Config.get('/constants/ANT_STATUS');

module.exports = function (mongoose) {
  var modelName = "ant";
  var Types = mongoose.Schema.Types;

  var coordSchema = new mongoose.Schema({
    latitude: {
      type: Types.Number,
    },
    longitude: {
      type: Types.Number,
    }
  });

  var Schema = new mongoose.Schema({
    name: {
      type: Types.String,
      required: true,
      unique: true
    },
    description: {
      type: Types.String
    },
    assetType: {
      type: Types.String,
     // enum: _.values(ASSET_TYPES),
    },
    countryCode: {
      type: Types.String,
      required: true,
      //  enum: _.values(COUNTRY_CODES),
    },
    status: {
      type: Types.String,
      required: true,
     //   enum: _.values(ANT_STATUS),
    },
    hasWarning: {
      type: Types.Boolean,
    },
    latitude: {
      type: Types.Number,
    },
    longitude: {
      type: Types.Number,
    },
    radius: {
      type: Types.Number,
    },
    dateFirstOnline: {
      type: Types.Date,
    },
    dateLastServiced: {
      type: Types.Date,
    },
    history: {
      type: Types.String,
    }
  }, { collection: modelName });
    
  Schema.statics = {
    collectionName:modelName,
    routeOptions: {
      extraEndpoints: [
        // Endpoints derived from real-time sensors
        function (server, model, options, Log) {
          Log = Log.bind(Chalk.magenta("Get ant data"));
          const Ant = model;

          const collectionName = model.collectionDisplayName || model.modelName;

          Log.note("Generating Get Data endpoints for " + collectionName);

          const getAntDataHandler = function (request, reply) {
            Ant.findOne({ _id: request.params.id })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant.");
                  return reply(true);
                }
                else {
                  Log.log("Did not find ant.");
                  return reply(false);
                }
              })
              .catch(function (error) {
                Log.error(error);
                return reply(Boom.badImplementation('There was an error accessing the database.'));
              });
          };

          //Get Coordinates from GPS
          const getCoordinatesHandler = function (request, reply) {
            Ant.findOne({ _id: request.params.id })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant.");
                  //TODO
                  var coordinate = {
                    latitude: result.latitude, 
                    longitude: result.longitude
                  }
                  return reply(JSON.stringify(coordinate));
                }
                else {
                  Log.log("Did not find ant by name.");
                  return reply(false);
                }
              })
              .catch(function (error) {
                Log.error(error);
                return reply(Boom.badImplementation('There was an error accessing the database.'));
              });
          };

          //Blink Light On/Off
          const blinkLightHandler = function (request, reply) {
            Ant.findOne({ _id: request.params.id })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant.");
                  var baseurl =
                    "http://192.168.1.238:5100/led/";  //hardcoded for now- replace by lookup from ip table
                  if (request.params.onoff == 'on') {
                    axios
                      .get(baseurl + 'switchon')
                      .then(response => {
                        console.log(
                          `LED turned on: ${response.data.results[0]}`
                        );
                      })
                      .catch(error => {
                        console.log(error);
                      });
                  }
                  else if (request.params.onoff == 'off') {
                    axios
                    .get(baseurl + 'switchoff')
                    .then(response => {
                      console.log(
                        `LED turned off: ${response.data.results[0]}`
                      );
                    })
                    .catch(error => {
                      console.log(error);
                    });
                  }
                  else { //invalid command
                    return reply(Boom.badRequest('Invalid command sent to LED'));
                  }
                  return reply(true);
                }
                else {
                  Log.log("Did not find ant.");
                  return reply(Boom.notFound('Could not find info about the ant you requested.'));
                }
              })
              .catch(function (error) {
                Log.error(error);
                return reply(Boom.badImplementation('There was an error accessing the database.'));
              });
          };

          //LED status - on (true) or off (false)
          const ledStatusHandler = function (request, reply) {
            Ant.findOne({ _id: request.params.id })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant.");
                  var baseurl =
                    "http://192.168.1.238:5100/led/";  
                    //hardcoded for now- TODO replace by lookup RESULTS from ip table                 
                  axios
                    .get(baseurl + 'status')
                    .then(response => {
                      let status = JSON.stringify(response.data);
                      console.log(
                        `LED status: ${status}`
                      );
                      let boolStatus = status.includes('true'); 
                      //would be better to have more robust solution for above
                      //i.e, publish an interface that firmware must support to connect
                      return reply(boolStatus);
                    })
                    .catch(error => {
                      console.log(error);
                      Log.error(error);
                      return reply(Boom.badImplementation('There was an error accessing the server.'));
                    });
                  }
                else {
                  console.log("Did not find ant." + request.params.id + " Got error: " + error);
                  Log.error("Did not find ant.");
                  return reply(Boom.notFound('Could not find info about the ant you requested.'));
                }
              })
              .catch(function (error) {
                console.log(error);
                Log.error(error);
                return reply(Boom.badImplementation('There was an error accessing the server.'));
              });
          };

          server.route({
            method: 'GET',
            path: '/ant/{id}/getData',
            config: {
              handler: getAntDataHandler,
              //add auth
              auth: null,
              description: 'ant data.',
              tags: ['api', 'ant', 'ant data'],
              validate: {
                  params: {
                      id: Joi.string().required()
                  },
              },
              plugins: {
                'hapi-swagger': {
                  responseMessages: [
                    { code: 200, message: 'Success' },
                    { code: 400, message: 'Bad Request' },
                    { code: 404, message: 'Not Found' },
                    { code: 500, message: 'Internal Server Error' }
                  ]
                }
              }
            }
          });

          server.route({
            method: 'GET',
            path: '/ant/{id}/getCoordinates',
            config: {
              handler: getCoordinatesHandler,
              //add auth
              auth: null,
              description: 'ant coordinates.',
              tags: ['api', 'ant', 'ant coordinates'],
              validate: {
                  params: {
                      id: Joi.string().required()
                  },
              },
              plugins: {
                'hapi-swagger': {
                  responseMessages: [
                    { code: 200, message: 'Success' },
                    { code: 400, message: 'Bad Request' },
                    { code: 404, message: 'Not Found' },
                    { code: 500, message: 'Internal Server Error' }
                  ]
                }
              }
            }
          });


          server.route({
            method: 'POST',
            path: '/ant/{id}/blinkLight/{onoff?}',
            config: {
              handler: blinkLightHandler,
              //add auth
              auth: null,
              description: 'ant light blink.',
              tags: ['api', 'ant', 'ant light blink'],
              validate: {
                  params: {
                      id: Joi.string().required(),
                      onoff: Joi.string()
                  },
              },
              plugins: {
                'hapi-swagger': {
                  responseMessages: [
                    { code: 200, message: 'Success' },
                    { code: 400, message: 'Bad Request' },
                    { code: 404, message: 'Not Found' },
                    { code: 500, message: 'Internal Server Error' }
                  ]
                }
              }
            }
          });

          server.route({
            method: 'GET',
            path: '/ant/{id}/ledStatus',
            config: {
              handler: ledStatusHandler,
              //add auth
              auth: null,
              description: 'ant light status',
              tags: ['api', 'ant', 'ant light blink'],
              validate: {
                  params: {
                      id: Joi.string().required(),
                  },
              },
              plugins: {
                'hapi-swagger': {
                  responseMessages: [
                    { code: 200, message: 'Success' },
                    { code: 400, message: 'Bad Request' },
                    { code: 404, message: 'Not Found' },
                    { code: 500, message: 'Internal Server Error' }
                  ]
                }
              }
            }
          });

        },
      ],
    },
  };

  return Schema;
};