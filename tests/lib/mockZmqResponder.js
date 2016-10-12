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
const Common = require('./utilities.js')

module.exports = (spec) => {
  let that = new EventEmitter()
  const TestHandler = spec.testHandler

  Winston.level = spec.logLevel || 'info'

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
    Winston.log('info', '[MockZmqRequester] Simulating bind to:', url)
  }

  /** @function connect
   *
   *  @summary  Absorbs the connect request.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  url - The desired connection path.
   *
   */
  that.connect = (url) => {
    Winston.log('info', '[MockZmqRequester] Simulating connect to:', url)
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
    Winston.log('info', '[MockZmqRequester] Simulating sending:', data)
    TestHandler(data)
  }

  return that
}