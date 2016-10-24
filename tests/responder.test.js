/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Winston = require('winston')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('requestValidator.js')
const MockZmqResponder = require('mockZmqResponder.js')
const Common = require('utilities.js')
const Config = require('configurationManager.js').config
const ResponderModule = require('responder.js')

Winston.level = Config.logLevel || 'info'
const TestResponse = function (data) {
  let jsonData = JSON.parse(data)
  Winston.log('info', '[ResponderTest] JSON response data:', jsonData)
  Validator.validateJsonResponse(jsonData, pendingDone, type)
}

Config.testHandler = TestResponse
const MZmqResponder = MockZmqResponder(Config)

// inject the mock object
Config.concreteResponder = MZmqResponder
// now instantiate the module to be tested
ResponderModule(Config)

let type, pendingDone

const CreateMessage = function (filename) {
  return {
    requestId: Uuid.v4(),
    requesterId: Uuid.v4(),
    messageId: Uuid.v4(),
    filename: filename,
    requestedAt: Date.now()
  }
}

describe('Responder', function () {
  describe('Correct Filename', function () {
    it('On receiving request should return response', function (done) {
      pendingDone = done
      const NewRequest = Common.createJsonRequest('target.txt')
      type = 'Response'
      MZmqResponder.makeRequest(JSON.stringify(NewRequest))
    })
  })

  describe('Incorrect Filename', function () {
    it('On receiving request should return error', function (done) {
      pendingDone = done
      const NewRequest = Common.createJsonRequest('incorrect filename')
      type = 'Error'
      MZmqResponder.makeRequest(JSON.stringify(NewRequest))
    })
  })
})

