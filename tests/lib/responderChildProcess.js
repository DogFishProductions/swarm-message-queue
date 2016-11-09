/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * This child process is necessary to prevent the responder from forking the entire unit test with cluster.
 */

// third-party modules
const Winston = require('winston')

// my modules
const Config = require('config.js')
const MockZmqDealer = require('mockZmqDealer.js')(Config)
const MockZmqRouter = require('mockZmqRouter.js')(Config)
const MockZmqResponder = require('mockZmqResponder.js')(Config)
const ResponderModule = require('responderCluster.js')

Winston.level = Config.logLevel || 'info'

// inject the mock object
Config.concreteResponder = MockZmqResponder
Config.concreteRouter = MockZmqRouter
Config.concreteDealer = MockZmqDealer

// now instantiate the module to be tested
ResponderModule(Config)

// pass on our message to the correct process
process.on('message', (m) => {
  // since requester forks this process using cluster we have to make sure we're talking to the right process
  // (we need to be talking to the cluster master, not the workers)
  if (m.pid === process.pid) {
    Winston.log('info', '[ResponderChildProcess] got message:', { m, pid: process.pid })
    MockZmqDealer.testHandler = m.testHandler
    MockZmqRouter.type = (m.request.validFilename ? 'Response' : 'Error')
    const Message = { requestId: m.request.requestId, filename: m.request.filename }                                        
    MockZmqDealer.makeRequest(JSON.stringify(Message))
  }
})
