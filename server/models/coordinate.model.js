'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function (mongoose) {
  var modelName = "coordinate";
  var Types = mongoose.Schema.Types;
  var Schema = new mongoose.Schema({
    latitude: {
      type: Types.Number,
    },
    longitude: {
        type: Types.Number,
    }
  }, { collection: modelName });
    
  Schema.statics = {
    collectionName:modelName,
    routeOptions: {
      associations: {
        //users: {
        //  type: "ONE_ONE",
        //  ant: "user"
       // }
      }
    }
  };

  return Schema;
};