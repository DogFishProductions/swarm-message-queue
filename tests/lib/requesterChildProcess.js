/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the requester from forking the entire unit test with cluster.
 * It uses 'rewire' to replace the zmq requester object with a mock which simulates its behaviour.
 */

// third-party modules
const Winston = require('winston')
const Rewire = require('rewire')
const _ = require('lodash')
const EventEmitter = require('events').EventEmitter

// my modules
// configuration file
const Config = require('../../services/lib/configurationManager.js')().config
// 'rewire', not 'require', the requester so we can set our mock during testing
const RequesterModule = Rewire('../../services/lib/requester.js')

/**
 * Creates a Mock object to simulate a zmq requester
 * @class
 */
class MockZmqRequester extends EventEmitter {
  constructor() {
    super()
  }

  /** @function connect
   *
   *  @summary  Absorbs the connection request.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  url - The desired connection path.
   *
   */
  connect (url) {
    Winston.log('info', '[MockZmqRequester] Simulating connect to:', url)
  }

  /** @function send
   *
   *  @summary  Absorbs the send request. Raises a 'message' event on itself together with the response data.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  send (data) {
    Winston.log('info', '[MockZmqRequester] Simulating sending:', data)
    const jsonData = JSON.parse(data)
    Winston.log('debug', '[MockZmqRequester] JSON data:', jsonData)
    const responseData = JSON.stringify({
      requestId: jsonData.requestId,
      requesterId: jsonData.requesterId,
      messageId: jsonData.messageId,
      body: 'This is a mock response',
      requestedAt: jsonData.requestedAt,
      respondedAt: Date.now(),
      responderId: 'ResponderId',
      responseType: 'Response'
    })
    Winston.log('debug', '[MockZmqRequester] Response data:', responseData)
    this.emit('message', responseData)
  }
}

/**
 * Creates a Mock object to simulate a Socket server
 * @class
 */
class MockNetServer extends EventEmitter {
  constructor(connection) {
    super()
    this.connection = connection
  }

  /** @function createServer
   *
   *  @summary  Absorbs the connection request.
   *
   *  @since 1.0.0
   *
   *  @param  {Function}  func - The connection initialiser function.
   *
   */
  createServer (func) {
    Winston.log('info', '[MockZmqRequester] Simulating server creation')
    func(this.connection)
    // allow chaining
    return this
  }

  /** @function listen
   *
   *  @summary  Absorbs the listen request.
   *
   *  @since 1.0.0
   *
   */
  listen (port, func) {
    Winston.log('info', '[MockZmqRequester] Simulating listen')
  }
}

/**
 * Creates a Mock object to simulate a Socket connection
 * @class
 */
class MockNetConnection extends EventEmitter {
  constructor() {
    super()
  }

  /** @function write
   *
   *  @summary  Absorbs the write request. Sends the data to the parent process.
   *
   *  @since 1.0.0
   *
   */
  write (data) {
    process.send(data)
  }

  /** @function makeRequest
   *
   *  @summary  Simulates the receipt of a request.
   *            Raises a 'data' event on itself together with a request string.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The request data.
   *
   */
  makeRequest (data) {
    this.emit('data', data)
  }
}

// replace the zmq module with our mock requester
RequesterModule.__set__('Requester', new MockZmqRequester())

// replace the net module with our mock server and connection
const MNetConnection = new MockNetConnection()
const MNetServer = new MockNetServer(MNetConnection)
RequesterModule.__set__('Net', MNetServer)

Winston.level = Config.logLevel || 'info'
const RequesterConf = Config.services.requester
RequesterConf.logLevel = Winston.level

// now instantiate the module to be tested
const Requester = RequesterModule(RequesterConf)

// This will send a message once for the cluster master and once for each worker.
// The cluster master regards it's containing process to be the test which forked this script, so the
// unit test will receive this message from the cluster master.
// The workers regard their containing process to be the cluster master, so the cluster master will receive
// this message from the workers.
process.send({ response: 'ready' })

// pass on our message to the correct process
process.on('message', (m) => {
  // since requester forks this process using cluster we have to make sure we're talking to the right process
  // (we need to be talking to the cluster master, not the workers)
  if (m.pid === process.pid) {
    Winston.log('info', '[RequesterChildProcess] got message:', { m, pid: process.pid })
    MNetConnection.makeRequest(m.request.requestId)
  }
})