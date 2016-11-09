/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Winston = require('winston')
const Uuid = require('node-Uuid')
const Q = require('q')

// my modules
const Config = require('config.js')
const Validator = require('testValidator.js')
const MockZmqResponderModule = require('mockZmqResponder.js')
const Common = require('utilities.js')
const ResponderModule = require('responder.js')
const ServiceManager = require('serviceManager.js')

Winston.level = Config.logLevel || 'info'

Config.testHandler = function (data) {
  let jsonData = JSON.parse(data)
  Winston.log('info', '[ResponderTest] JSON response data:', jsonData)
  Validator.validateJsonResponse(jsonData, type, pendingDone)
}
const CreateMessage = function (filename) {
  return {
    requestId: Uuid.v4(),
    requesterId: Uuid.v4(),
    messageId: Uuid.v4(),
    filename: filename,
    requestedAt: Date.now()
  }
}

// inject the mock object
const MockZmqResponder = MockZmqResponderModule(Config)
Config.concreteResponder = MockZmqResponder

let type, pendingDone

describe('Responder', function () {
  before(function(done) {
    ServiceManager.getService('fileReader', Config)
    .done(
      handler => {
        Config.responderHandler = handler
        // now instantiate the module to be tested
        ResponderModule(Config)
        done()        
      },
      err => {
        Winston.log('error', '[ResponderTest] we had an error loading the handler', err)
        done(err)
      }
    )
  })

  describe('Correct Filename', function () {
    it('On receiving request should return response', function (done) {
      pendingDone = done
      const NewRequest = Common.createJsonRequest({ filename: 'target.txt' })
      type = 'Response'
      MockZmqResponder.makeRequest(JSON.stringify(NewRequest))
    })
  })

  describe('Incorrect Filename', function () {
    it('On receiving request should return error', function (done) {
      pendingDone = done
      const NewRequest = Common.createJsonRequest({ filename: 'incorrect filename' })
      type = 'Error'
      MockZmqResponder.makeRequest(JSON.stringify(NewRequest))
    })
  })
})
