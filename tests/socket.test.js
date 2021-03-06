/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A description
 */

// third-party modules
const Winston = require('winston')
const Uuid = require('node-Uuid')

// my modules
const Validator = require('testValidator.js')
const Common = require('utilities.js')
// configuration file
const Config = require('config.js')
const SocketModule = require('socket.js')
const MockNetSocket = require('mockNetSocketClient.js')(Config)

Winston.level = Config.logLevel || 'info'

// inject the mock object
Config.concreteSocketClient = MockNetSocket
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

