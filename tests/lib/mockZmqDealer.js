/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Creates a Mock object to simulate a zmq responder
 * @class
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

// my modules
const Utilities = require('utilities.js')

module.exports = (spec) => {
  let that = new EventEmitter()
  let testHandler

  Winston.level = spec.logLevel || 'info'

  Object.defineProperty(that, 'testHandler', {
    set (value) {
      testHandler = value
    }
  })

  /** @function makeRequest
   *
   *  @summary  Simulates the receipt of a request.
   *            Raises a 'message' event on itself together with a request string.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The request data.
   *
   */
  that.makeRequest = (data) => {
    that.emit('message', data)
  }

  // Mock methods by overriding them

  /** @function bind
   *
   *  @summary  Absorbs the bind request.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  url - The desired connection path.
   *
   */
  that.bind = (url) => {
    Winston.log('info', '[MockZmqDealer] Simulating bind to:', url)
    return that
  }

  /** @function send
   *
   *  @summary  Absorbs the send request. Tests the response data.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  that.send = (data) => {
    Winston.log('info', '[MockZmqDealer] Simulating sending:', data)
    process.send(data)
  }

  return that
}