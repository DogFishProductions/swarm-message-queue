/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Rewire = require('rewire')
const Expect = require('chai').expect
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

// my modules
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
// 'rewire', not 'require', the responder so we can set our mock during testing
const ResponderModule = Rewire('../services/lib/responder.js')

/**
 * Creates a Mock object to simulate a zmq responder
 * @class
 */
class MockZmqResponder extends EventEmitter {
  constructor() {
    super()
  }

  /** @function bind
   *
   *  @summary  Absorbs the bind request.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  url - The desired connection path.
   *
   */
  bind (url) {
    Winston.log('info', '[MockZmqRequester] Simulating connect to:', url)
  }

  /** @function send
   *
   *  @summary  Absorbs the send request. Tests the response data.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  send (data) {
    Winston.log('info', '[MockZmqRequester] Simulating sending:', data)
    TestResponse(data)
  }

  /** @function makeRequest
   *
   *  @summary  Simulates the receipt of a request.
   *            Raises a 'message' event on itself together with a request string.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The request data.
   *
   */
  makeRequest (data) {
    this.emit('message', data)
  }
}

const MZmqResponder = new MockZmqResponder()
// replace the zmq module with our mock
ResponderModule.__set__('Responder', MZmqResponder)

Winston.level = Config.logLevel || 'info'
const ResponderConf = Config.services.responder
ResponderConf.logLevel = Winston.level

// now instantiate the module to be tested
const Responder = ResponderModule(ResponderConf)

let type, pendingDone

const TestResponse = function (data) {
  let jsonData = JSON.parse(data)
  Winston.log('info', '[ResponderTest] JSON response data:', jsonData)
  Expect(jsonData).to.exist
  Expect(jsonData.requestId).to.equal('RequestId')
  Expect(jsonData.requesterId).to.equal('RequesterId')
  Expect(jsonData.messageId).to.equal('MessageId')
  Expect(jsonData.requestedAt).to.equal('RequestedAt')
  Expect(jsonData.responderId).to.exist
  Expect(jsonData.respondedAt).to.exist
  Expect(jsonData.responseType).to.equal(type)
  Expect(jsonData.body).to.exist
  pendingDone()
}

describe('Responder', function () {

  describe('Correct Filename', function() {
    it ('On receiving request should return response', function (done) {
      pendingDone = done
      const NewMessage = {
        requestId: 'RequestId',
        requesterId: 'RequesterId',
        messageId: 'MessageId',
        filename: Config.services.requester.filename,
        requestedAt: 'RequestedAt'
      }
      type = 'Response'   
      MZmqResponder.makeRequest(JSON.stringify(NewMessage))
    })
  })

  describe('Incorrect Filename', function() {
    it ('On receiving request should return error', function (done) {
      pendingDone = done
      const NewMessage = {
        requestId: 'RequestId',
        requesterId: 'RequesterId',
        messageId: 'MessageId',
        filename: 'incorrect',
        requestedAt: 'RequestedAt'
      }
      type = 'Error'
      MZmqResponder.makeRequest(JSON.stringify(NewMessage))
    })
  })

})

  