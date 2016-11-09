/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Tests the behaviour of the requester module. The socket server and connection which receive incoming
 * requests in the cluster master are both replaced by mock objects.  Similarly, the responder which reacts
 * worker requests is replaced by a mock.
 *
 * It is necessary to fork a child process to run the requester under test. This is because the requester
 * itself forks worker processes using cluster, and if we were to run it in this process cluster would
 * fork not only the worker processes but this entire unit test which is not what we want.
 */

// third-party modules
const Winston = require('winston')
const Fork = require('child_process').fork
const Path = require('path')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('testValidator.js')
const Config = require('config.js')
Winston.level = Config.logLevel || 'info'

let child

describe('RequesterCluster', function () {
  let ready = false

  before(function (done) {
    // fork separate process to prevent cluster forking this test process
    child = Fork(Path.join(__dirname, '/lib/requesterChildProcess.js'))
    child.on('message', function (m) {
      Winston.log('debug', '[RequesterTest] received response:', m)
      if (m.response === 'workers ready') {
        done()
      }
    })
  })

  describe('Correct Filename', function () {
    it('On making request should receive response', function (done) {
      // override previous message callback
      child.on('message', function (data) {
        // the data we receive will be JSON because it comes directly from the 'makeRequest' method
        Validator.validateJsonClusterResponse(data, done)
      })
      child.send({ request: { requestId: Uuid.v4(), validFilename: true, filename: 'target.txt' }, pid: child.pid })
    })
  })

  after(function (done) {
    child.kill()
    done()
  })
})

