/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Rewire = require('rewire')
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('./lib/requestValidator.js')
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
// 'rewire', not 'require', the responder so we can set our mock during testing
const SocketModule = Rewire('../services/lib/socket.js')

/**
 * Creates a Mock object to simulate a zmq responder
 * @class
 */
class MockNetSocket extends EventEmitter {
  constructor () {
    super()
    // spoof these attributes to pass test in socket service.
    this._handle = true
    this.writable = true
  }

  /** @function connect
   *
   *  @summary  Absorbs the connect request. Runs the supplied callback.
   *
   *  @since 1.0.0
   *
   *  @param  {Number}  port - The desired connection port.
   *  @param  {String}  host - The desired connection host.
   *  @param  {Function}  callback - The callback to be run on connection.
   *
   */
  connect (port, host, callback) {
    Winston.log('info', '[MockNetSocket] Simulating connect to:', { port: port, host: host })
    callback()
  }

  /** @function write
   *
   *  @summary  Absorbs the write request. Triggers a data response event.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  write (data) {
    Winston.log('info', '[MockNetSocket] Simulating sending:', data)
    const Response = []
    const Message = {}
    Message[data] = []
    for (let i = 0; i < Config.services.requester.processes; i++) {
      Message[data].push({
        requesterId: Uuid.v4(),
        messageId: Uuid.v4(),
        body: 'This is a test',
        requestedAt: Date.now(),
        respondedAt: Date.now(),
        responderId: process.pid,
        responseType: 'Response'
      })
    }
    Response.push(Message)
    this.emit('data', JSON.stringify(Response))
  }
}

// make this mock look like a module (so we can create a mock with 'new Net.Socket()')
const Net = { Socket: MockNetSocket }
// replace the net module with our mock
SocketModule.__set__('Net', Net)

Winston.level = Config.logLevel || 'info'
const SocketConf = Config.services.socket.connection
SocketConf.logLevel = Winston.level
// now instantiate the module to be tested
const Socket = SocketModule(SocketConf)

describe('Socket', function () {
  describe('Make request', function () {
    it('On receiving request should return UUID', function (done) {
      Socket.connect()
      Socket.makeRequest('this can be any string')
      .done(
        function (data) {
          Validator.validateRequest(data, done)
        },
        function (err) {
          done(err)
        }
      )
    })
  })
})

