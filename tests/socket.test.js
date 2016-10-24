/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Winston = require('winston')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('requestValidator.js')
const Common = require('utilities.js')
// configuration file
const Config = require('configurationManager.js').config
const SocketModule = require('socket.js')
const MockNetSocket = require('mockNetSocketClient.js')

Winston.level = Config.logLevel || 'info'

// inject the mock object
Config.concreteSocketClient = MockNetSocket(Config)
// now instantiate the module to be tested
const Socket = SocketModule(Config)

describe('Socket', function () {
  describe('Make request', function () {
    it('On receiving request should return UUID', function (done) {
      Socket.connect()
      Socket.makeRequest('this can be any string')
      .done(
        function (data) {
          Validator.validateJsonClusterResponse(data, done)
        },
        function (err) {
          done(err)
        }
      )
    })
  })
})

