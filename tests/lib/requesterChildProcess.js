/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the requester from forking the entire unit test with cluster.
 * It uses 'rewire' to replace the zmq requester object with a mock which simulates its behaviour.
 */

// third-party modules
const Winston = require('winston')

// my modules
const MockZmqRequester = require('mockZmqRequester.js')
const MockNetSocketServer = require('mockNetSocketServer.js')
const MockNetSocketConnection = require('mockNetSocketConnection.js')
// configuration file
const Config = require('config.js')
const RequesterModule = require('requesterCluster.js')

Winston.level = Config.logLevel || 'info'

const MZmqRequester = MockZmqRequester(Config)
// inject the mock object
Config.concreteRequester = MZmqRequester

// replace the net module with our mock server and connection
const MNetConnection = MockNetSocketConnection(Config)
Config.connection = MNetConnection
const MNetSocketServer = MockNetSocketServer(Config)
Config.concreteSocketServer = MNetSocketServer

// now instantiate the module to be tested
RequesterModule(Config)

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
