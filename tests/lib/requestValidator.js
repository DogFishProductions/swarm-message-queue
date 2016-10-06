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
const Config = require('../../services/lib/configurationManager.js')().config
Winston.level = Config.logLevel || 'info'

// don't use arrow functions here as this will be passed to mocha which doesn't like them
const ValidateRequest = function (data, cb) {
  try {
    Expect(data).to.exist
    Expect(data).to.not.be.empty
    let currentMessages, currentMessage
    for (let i = 0; i < data.length; i++) {
      currentMessages = data[i]
      Expect(currentMessages).to.not.be.empty
      _.forOwn(currentMessages, (value, key) => {
        Expect(Validator.isUUID(key, 4)).to.be.true
        Expect(value).to.have.lengthOf(Config.services.requester.processes)
        for (let j = 0; j < value.length; j++) {
          currentMessage = value[j]
          InternalValidateMessage(currentMessage)
        }
      })
    }
    cb()
  } catch (err) {
    cb(err)
  }
}

const ValidateMessage = function (data, cb, type) {
  try {
    InternalValidateMessage(data, type)
    cb()
  } catch (err) {
    cb(err)
  }
}

const InternalValidateMessage = function (data, type) {
  Winston.log('debug', 'validating message')
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
  Winston.log('debug', 'message valid')
}

module.exports.validateRequest = ValidateRequest
module.exports.validateMessage = ValidateMessage
