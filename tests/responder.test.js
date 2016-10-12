/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Rewire = require('rewire')
//const EventEmitter = require('events').EventEmitter
const Winston = require('winston')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('./lib/requestValidator.js')
const MockZmqResponder = require('./lib/mockZmqResponder.js')
const Common = require('./lib/utilities.js')
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
// 'rewire', not 'require', the responder so we can set our mock during testing
const ResponderModule = Rewire('../services/lib/responder.js')

Winston.level = Config.logLevel || 'info'
const TestResponse = function (data) {
  let jsonData = JSON.parse(data)
  Winston.log('info', '[ResponderTest] JSON response data:', jsonData)
  Validator.validateJsonResponse(jsonData, pendingDone, type)
}

//const MZmqResponder = new MockZmqResponder()
const MZmqResponder = MockZmqResponder({
  logLevel: Winston.level,
  testHandler: TestResponse
})
// replace the zmq module with our mock
ResponderModule.__set__('Responder', MZmqResponder)

const ResponderConf = Config.services.responder
ResponderConf.logLevel = Winston.level

// now instantiate the module to be tested
ResponderModule(ResponderConf)

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

