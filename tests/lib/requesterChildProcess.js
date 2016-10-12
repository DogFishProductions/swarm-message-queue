/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the requester from forking the entire unit test with cluster.
 * It uses 'rewire' to replace the zmq requester object with a mock which simulates its behaviour.
 */

// third-party modules
const Winston = require('winston')
const Rewire = require('rewire')
const EventEmitter = require('events').EventEmitter

// my modules
const MockZmqRequester = require('./mockZmqRequester.js')
const MockNetSocketServer = require('./mockNetSocketServer.js')
const MockNetSocketConnection = require('./mockNetSocketConnection.js')
// configuration file
const Config = require('../../services/lib/configurationManager.js')().config
// 'rewire', not 'require', the requester so we can set our mock during testing
const RequesterModule = Rewire('../../services/lib/requester-cluster.js')

const Spec = { logLevel: Winston.level }
const MZmqRequester = MockZmqRequester(Spec)
// replace the zmq module with our mock requester
RequesterModule.__set__('Requester', MZmqRequester)

// replace the net module with our mock server and connection
const MNetConnection = MockNetSocketConnection(Spec)
Spec.connection = MNetConnection
const MNetSocketServer = MockNetSocketServer(Spec)
RequesterModule.__set__('Net', MNetSocketServer)

Winston.level = Config.logLevel || 'info'

// now instantiate the module to be tested
RequesterModule(Config)

// This will send a message once for the cluster master and once for each worker.
// The cluster master regards it's containing process to be the test which forked this script, so the
// unit test will receive this message from the cluster master.
// The workers regard their containing process to be the cluster master, so the cluster master will receive
// this message from the workers.
//process.send({ response: 'ready' })

// pass on our message to the correct process
process.on('message', (m) => {
  // since requester forks this process using cluster we have to make sure we're talking to the right process
  // (we need to be talking to the cluster master, not the workers)
  if (m.pid === process.pid) {
    Winston.log('info', '[RequesterChildProcess] got message:', { m, pid: process.pid })
    MZmqRequester.type = (m.request.validFilename ? 'Response' : 'Error')
    const Message = { requestId: m.request.requestId, filename: m.request.filename }
    MNetConnection.makeRequest(JSON.stringify(Message))
  }
})
