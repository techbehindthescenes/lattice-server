'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');
const _ = require('lodash');
const Config = require('../../config');
const axios = require("axios");

const NODE_TYPES = Config.get('/constants/NODE_TYPES');
const COUNTRY_CODES = Config.get('/constants/COUNTRY_CODES');
const NODE_STATUS = Config.get('/constants/NODE_STATUS');

module.exports = function (mongoose) {
  var modelName = "spoke";
  var Types = mongoose.Schema.Types;
  var Schema = new mongoose.Schema({
    name: {
      type: Types.String,
      required: true,
      unique: true
    },
    description: {
      type: Types.String
    },
    nodeType: {
      type: Types.String,
      required: true,        
      enum: _.values(NODE_TYPES),
    },
    countryCode: {
        type: Types.String,
        required: true,
        enum: _.values(COUNTRY_CODES),
    },
    status: {
        type: Types.String,
        required: true,
        enum: _.values(NODE_STATUS),
    },
    inMaintenance: {
        type: Types.Boolean,
        required: true,
    },
    version: {
      type: Types.String,
    }
  }, { collection: modelName });
    
  Schema.statics = {
    collectionName:modelName,
    routeOptions: {
      extraEndpoints: [
        // Endpoints derived from real-time sensors
        function (server, model, options, Log) {
          Log = Log.bind(Chalk.magenta("Get spoke data"));
          const Spoke = model;

          const collectionName = model.collectionDisplayName || model.modelName;

          Log.note("Generating Get Data endpoints for " + collectionName);

          const getSpokeDataHandler = function (request, reply) {
            Spoke.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found spoke by name.");
                  return reply(true);
                }
                else {
                  Log.log("Did not find spoke by name.");
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
            Spoke.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found spoke by name.");
                  var coordinate = {
                    latitude: 42.324094, 
                    longitude: -71.384572
                  }
                  return reply(JSON.stringify(coordinate));
                }
                else {
                  Log.log("Did not find spoke by name.");
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
            Spoke.findOne({ name: request.params.name })
              .then(function (result) {
                if (result) {
                  Log.log("Found spoke by name.");
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
                  Log.log("Did not find spoke by name.");
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
            path: '/spoke/{name}/getData',
            config: {
              handler: getSpokeDataHandler,
              //add auth
              auth: null,
              description: 'Spoke data.',
              tags: ['api', 'Spoke', 'Spoke data'],
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
            path: '/spoke/{name}/getCoordinates',
            config: {
              handler: getCoordinatesHandler,
              //add auth
              auth: null,
              description: 'Spoke coordinates.',
              tags: ['api', 'Spoke', 'Spoke coordinates'],
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
            path: '/spoke/{name}/blinkLight/{onoffstatus?}',
            config: {
              handler: blinkLightHandler,
              //add auth
              auth: null,
              description: 'Spoke light blink.',
              tags: ['api', 'Spoke', 'Spoke light blink'],
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