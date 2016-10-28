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
const Config = require('config.js')
Winston.level = Config.logLevel || 'info'

// don't use arrow functions here as this will be passed to mocha which doesn't like them
const ValidateJsonClusterResponse = function (data, cb) {
  try {
    Expect(data).to.exist
    Expect(data).to.not.be.empty
    let currentResponses, currentResponse
    Expect(data).to.not.be.empty
    _.forOwn(data, (value, key) => {
      Expect(key).to.exist
      Expect(Validator.isUUID(key.toString(), 4)).to.be.true
      Expect(value).to.have.lengthOf(Config.services['requesterCluster'].processes)
      for (currentResponse of value) {
        if (!currentResponse.requestId) {
          currentResponse.requestId = key
        }
        InternalValidateJsonResponse(currentResponse)
      }
    })
    cb()
  } catch (err) {
    cb(err)
  }
}

const ValidateJsonResponse = function (data, type, cb) {
  try {
    InternalValidateJsonResponse(data, type)
    cb()
  } catch (err) {
    cb(err)
  }
}

const InternalValidateJsonResponse = function (data, type) {
  try {
    Winston.log('debug', '[Validator] validating response')
    Expect(data).to.exist
    Expect(typeof data).to.equal('object')
    Expect(data.requesterId).to.exist
    Expect(Validator.isUUID(data.requesterId.toString(), 4)).to.be.true
    Expect(data.requestId).to.exist
    Expect(Validator.isUUID(data.requestId.toString(), 4)).to.be.true
    Expect(data.messageId).to.exist
    Expect(Validator.isUUID(data.messageId.toString(), 4)).to.be.true
    Expect(data.responderId).to.exist
    Expect(Validator.isInt(data.responderId.toString() + '')).to.be.true
    Expect(data.requestedAt).to.exist
    Expect(Validator.isInt(data.requestedAt.toString() + '')).to.be.true
    Expect(data.respondedAt).to.exist
    Expect(Validator.isInt(data.respondedAt.toString() + '')).to.be.true
    Expect(['Response', 'Error']).to.include(data.responseType)
    if (type) {
      Expect(data.responseType).to.equal(type)
    }
    Expect(data.body).to.exist
    Expect(data).to.contain.all.keys(['requesterId', 'messageId', 'responderId', 'requestedAt', 'respondedAt', 'responseType', 'body'])
    Winston.log('debug', '[Validator] message valid')
  }
  catch(err) {
    throw err
  }
  
}

const ValidateJsonRequest = function (data, cb) {
  try {
    Winston.log('debug', '[Validator] validating request')
    Expect(data).to.exist
    Expect(typeof data).to.equal('object')
    Expect(Validator.isUUID(data.requesterId.toString(), 4)).to.be.true
    Expect(Validator.isUUID(data.requestId.toString(), 4)).to.be.true
    Expect(Validator.isUUID(data.messageId.toString(), 4)).to.be.true
    Expect(Validator.isInt(data.requestedAt + '')).to.be.true
    cb()
  }
  catch(err) {
    cb(err)
  }
  
}

module.exports.validateJsonClusterResponse = ValidateJsonClusterResponse
module.exports.validateJsonResponse = ValidateJsonResponse
module.exports.validateJsonRequest = ValidateJsonRequest
