/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Creates a Mock object to simulate a Socket server
 * @class
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

module.exports = (spec) => {
  let that = new EventEmitter()
  let connection = spec.connection

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

  return that
}