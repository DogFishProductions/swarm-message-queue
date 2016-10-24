/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Expect = require('chai').expect
const _ = require('lodash')
const Validator = require('validator')
const Winston = require('winston')

// my modules
// configuration file
const Config = require('configurationManager.js').config
Winston.level = Config.logLevel || 'info'

// don't use arrow functions here as this will be passed to mocha which doesn't like them
const ValidateJsonClusterResponse = function (data, cb) {
  try {
    Expect(data).to.exist
    Expect(data).to.not.be.empty
    let currentResponses, currentResponse
    for (let i = 0; i < data.length; i++) {
      currentResponses = data[i]
      Expect(currentResponses).to.not.be.empty
      _.forOwn(currentResponses, (value, key) => {
        Expect(Validator.isUUID(key, 4)).to.be.true
        Expect(value).to.have.lengthOf(Config.services['requester-cluster'].processes)
        for (let j = 0; j < value.length; j++) {
          currentResponse = value[j]
          InternalValidateJsonResponse(currentResponse)
        }
      })
    }
    cb()
  } catch (err) {
    cb(err)
  }
}

const ValidateJsonResponse = function (data, cb, type) {
  try {
    InternalValidateJsonResponse(data, type)
    cb()
  } catch (err) {
    cb(err)
  }
}

const InternalValidateJsonResponse = function (data, type) {
  Winston.log('debug', '[Validator] validating response')
  Expect(data).to.exist
  Expect(typeof data).to.equal('object')
  Expect(Validator.isUUID(data.requesterId, 4)).to.be.true
  Expect(Validator.isUUID(data.messageId, 4)).to.be.true
  Expect(Validator.isInt(data.responderId + '')).to.be.true
  Expect(Validator.isInt(data.requestedAt + '')).to.be.true
  Expect(Validator.isInt(data.respondedAt + '')).to.be.true
  Expect(['Response', 'Error']).to.include(data.responseType)
  if (type) {
    Expect(data.responseType).to.equal(type)
  }
  Expect(data.body).to.exist
  Expect(data).to.contain.all.keys(['requesterId', 'messageId', 'responderId', 'requestedAt', 'respondedAt', 'responseType', 'body'])
  Winston.log('debug', '[Validator] message valid')
}

module.exports.validateJsonClusterResponse = ValidateJsonClusterResponse
module.exports.validateJsonResponse = ValidateJsonResponse
