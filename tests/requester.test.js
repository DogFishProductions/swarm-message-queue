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
const Expect = require('chai').expect
const Winston = require('winston')
const _ = require('lodash')
const Fork = require('child_process').fork
const Util = require('util')

// my modules
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
Winston.level = Config.logLevel || 'info'

let child

describe('Requester', function () {
  let ready = false

  before(function (done) {
    // fork separate process to prevent cluster forking this test process
    child = Fork(__dirname + '/lib/requesterChildProcess.js')
    child.on('message', function(m) {
      Winston.log('debug', '[RequesterTest] received response:', m)
      if (m.response === 'workers ready') {
          done()
      }
    })
  })

  describe('Correct Filename', function() {
    it ('On making request should receive response', function (done) {
      // override previous message callback
      child.on('message', function(data) {
        // the data we receive will be JSON because it comes directly from the 'makeRequest' method
        Winston.log('debug', '[RequesterTest] received response:', data)
        Expect(data).to.exist
        Expect(data).to.not.be.empty
        let currentMessages, currentMessage
        for (let i = 0; i < data.length; i++) {
          currentMessages = data[i]
          Expect(currentMessages).to.not.be.empty
          _.forOwn(currentMessages, (value, key) => {
            Expect(key).to.equal('RequestId')
            Expect(value).to.have.lengthOf(Config.services.requester.processes)
            for (let j = 0; j < value.length; j++) {
              currentMessage = value[j]
              Expect(currentMessage.requesterId).to.exist
              Expect(currentMessage.messageId).to.exist
              Expect(currentMessage.requestedAt).to.exist
              Expect(currentMessage.responderId).to.exist
              Expect(currentMessage.respondedAt).to.exist
              Expect(currentMessage.responseType).to.equal('Response')
              Expect(currentMessage.body).to.exist
            }
          })
        }
        done()
      })
      child.send({ request: { requestId: 'RequestId', validFilename: true }, pid: child.pid })
    })
  })

  after(function (done) {
    child.kill()
    done()
  })
})

  