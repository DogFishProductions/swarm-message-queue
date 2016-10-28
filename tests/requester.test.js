/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the requester from forking the entire unit test with cluster.
 * It uses 'rewire' to replace the zmq requester object with a mock which simulates its behaviour.
 */

// third-party modules
const Winston = require('winston')

// my modules
const Validator = require('testValidator.js')
const Common = require('utilities.js')
const MockZmqRequester = require('mockZmqRequester.js')
const Config = require('config.js')
const RequesterModule = require('requester.js')

const MZmqRequester = MockZmqRequester(Config)

Winston.level = Config.logLevel || 'info'

// inject the mock object
Config.concreteRequester = MZmqRequester
// now instantiate the module to be tested
let Requester = RequesterModule(Config)

let type, pendingDone

const TestResponse = function (data) {
  Winston.log('info', '[RequesterTest] JSON response data:', data)
  Validator.validateJsonResponse(data, type, pendingDone)
}

describe('Requester', function () {
  describe('Correct Filename', function () {
    it('On sending request should receive response', function (done) {
      pendingDone = done
      const NewMessage = Common.createJsonRequest({ filename: Config.services.requester.filename })
      type = 'Response'
      Requester.makeRequest(NewMessage)
      .done(
        function (response) {
          TestResponse(response)
        },
        function (err) {
          pendingDone(err)
        }
      )
    })
  })

  describe('Incorrect Filename', function () {
    it('On sending request should receive error', function (done) {
      pendingDone = done
      const NewMessage = Common.createJsonRequest({ filename: 'incorrect filename' })
      type = 'Error'
      MZmqRequester.type = type
      Requester.makeRequest(NewMessage)
      .done(
        function (response) {
          TestResponse(response)
        },
        function (err) {
          pendingDone(err)
        }
      )
    })
  })

  describe('Response Timeout', function () {
    it('On sending request should receive notification of timeout', function (done) {
      pendingDone = done
      const NewMessage = Common.createJsonRequest({ filename: 'target.txt' })
      type = 'Error'
      MZmqRequester.type = type
      // reset the timeout to be below the delay
      Config.services.requester.timeout = 10
      Requester = RequesterModule(Config)
      Requester.makeRequest(NewMessage)
      .done(
        function (response) {
          TestResponse(response)
        },
        function (err) {
          pendingDone(err)
        }
      )
    })
  })
})
