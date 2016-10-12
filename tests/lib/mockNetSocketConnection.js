/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Creates a Mock object to simulate a Socket connection
 * @class
 */


// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

module.exports = (spec) => {
  let that = new EventEmitter()

  Winston.level = spec.logLevel || 'info'

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
    that.emit('data', data)
  }

  // Mock methods by overriding them

  /** @function write
   *
   *  @summary  Absorbs the write request. Sends the data to the parent process.
   *
   *  @since 1.0.0
   *
   */
  that.write = (data) => {
    process.send(data)
  }


  return that
}