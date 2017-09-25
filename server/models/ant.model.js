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
            Ant.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant by name.");
                  return reply(true);
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

          //Get Coordinates from GPS
          const getCoordinatesHandler = function (request, reply) {
            Ant.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant by name.");
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
            Ant.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found ant by name.");
                  var baseurl =
                    "http://192.168.1.238:5100/led/";  //hardcoded for now- replace by lookup from ip table
                  if (request.params.onoffstatus == 'on') {
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
                  else if (request.params.onoffstatus == 'off') {
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
                  else if (request.params.onoffstatus == 'status') { 
                    axios
                    .get(baseurl + 'status')
                    .then(response => {
                      console.log(
                        `LED status: ${response.data.results[0]}`
                      );
                    })
                    .catch(error => {
                      console.log(error);
                    });
                  }
                  else { //invalid command
                    return reply("invalid command sent to LED");
                  }
                  return reply(true);
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

          server.route({
            method: 'GET',
            path: '/ant/{name}/getData',
            config: {
              handler: getAntDataHandler,
              //add auth
              auth: null,
              description: 'ant data.',
              tags: ['api', 'ant', 'ant data'],
              validate: {
                  params: {
                      name: Joi.string().required()
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
            path: '/ant/{name}/getCoordinates',
            config: {
              handler: getCoordinatesHandler,
              //add auth
              auth: null,
              description: 'ant coordinates.',
              tags: ['api', 'ant', 'ant coordinates'],
              validate: {
                  params: {
                      name: Joi.string().required()
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
            path: '/ant/{name}/blinkLight/{onoffstatus?}',
            config: {
              handler: blinkLightHandler,
              //add auth
              auth: null,
              description: 'ant light blink.',
              tags: ['api', 'ant', 'ant light blink'],
              validate: {
                  params: {
                      name: Joi.string().required(),
                      onoffstatus: Joi.string()
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