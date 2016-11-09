/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the requester from forking the entire unit test with cluster.
 */

// third-party modules
const Winston = require('winston')

// my modules
const Config = require('config.js')
const MockZmqRequester = require('mockZmqRequester.js')(Config)
const MockNetSocketServer = require('mockNetSocketServer.js')(Config)
const RequesterModule = require('requesterCluster.js')

Winston.level = Config.logLevel || 'info'

// inject the mock object
Config.concreteRequester = MockZmqRequester

// replace the net module with our mock server and connection
Config.concreteSocketServer = MockNetSocketServer

// now instantiate the module to be tested
RequesterModule(Config)

// pass on our message to the correct process
process.on('message', (m) => {
  // since requester forks this process using cluster we have to make sure we're talking to the right process
  // (we need to be talking to the cluster master, not the workers)
  if (m.pid === process.pid) {
    Winston.log('info', '[RequesterChildProcess] got message:', { m, pid: process.pid })
    MockZmqRequester.type = (m.request.validFilename ? 'Response' : 'Error')
    const Message = { requestId: m.request.requestId, filename: m.request.filename }                                        
    MockNetSocketServer.makeRequest(JSON.stringify(Message))
  }
})
