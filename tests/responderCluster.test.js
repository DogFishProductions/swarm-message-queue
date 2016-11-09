/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Tests the behaviour of the responder module.
 *
 * It is necessary to fork a child process to run the responder under test. This is because the responder
 * itself forks worker processes using cluster, and if we were to run it in this process cluster would
 * fork not only the worker processes but this entire unit test which is not what we want.
 */

// third-party modules
const Winston = require('winston')
const Fork = require('child_process').fork
const Path = require('path')
const Uuid = require('node-Uuid')
const Util = require('util')

// my modules
const Validator = require('testValidator.js')
const Config = require('config.js')
Winston.level = Config.logLevel || 'info'

const TestResponse = function (data) {
  Winston.log('info', '[ResponderClusterTest] JSON response data:', data)
  Validator.validateJsonResponse(data, type, pendingDone)
}

let child, pendingDone, type

describe('ResponderCluster', function () {
  let ready = false

  before(function (done) {
    // fork separate process to prevent cluster forking this test process
    child = Fork(Path.join(__dirname, '/lib/responderChildProcess.js'))
    child.on('message', function (m) {
      Winston.log('debug', '[ResponderTest] received response:', m)
      if (m.response === 'workers ready') {
        done()
      }
      else {
        // the test response from the dealer
        TestResponse(JSON.parse(m))
      }
    })
  })

  describe('Correct Filename', function () {
    it('On making request should receive response', function (done) {
      pendingDone = done
      type = 'Response'
      child.send({ request: { requestId: Uuid.v4(), validFilename: true, filename: 'target.txt' }, pid: child.pid, testHandler: TestResponse })
    })
  })

  describe('Incorrect Filename', function () {
    it('On making request should receive error', function (done) {
      pendingDone = done
      type = 'Error'
      child.send({ request: { requestId: Uuid.v4(), validFilename: false, filename: 'target.txt' }, pid: child.pid, testHandler: TestResponse })
    })
  })

  after(function (done) {
    child.kill()
    done()
  })
})

