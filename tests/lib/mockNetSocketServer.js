/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Creates a Mock object to simulate a Socket server
 * @class
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

// my modules
const MockNetSocketConnection = require('mockNetSocketConnection.js')

module.exports = (spec) => {
  let that = new EventEmitter()
  let connection = MockNetSocketConnection(spec)

  Winston.level = spec.logLevel || 'info'

  // Mock methods by overriding them

  /** @function createServer
   *
   *  @summary  Absorbs the connection request.
   *
   *  @since 1.0.0
   *
   *  @param  {Function}  func - The connection initialiser function.
   *
   */
  that.createServer = (func) => {
    Winston.log('info', '[MockZmqRequester] Simulating server creation')
    func(connection)
    // allow chaining
    return that
  }

  /** @function listen
   *
   *  @summary  Absorbs the listen request.
   *
   *  @since 1.0.0
   *
   */
  that.listen = (port, func) => {
    Winston.log('info', '[MockZmqRequester] Simulating listen')
  }

  /** @function makeRequest
   *
   *  @summary  Simulates the receipt of a request.
   *            Raises a 'data' event on itself together with a request string.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The request data.
   *
   */
  that.makeRequest = (data) => {
    connection.emit('data', data)
  }

  return that
}