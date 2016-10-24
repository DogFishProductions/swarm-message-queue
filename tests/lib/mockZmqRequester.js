/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

// my modules
const Common = require('utilities.js')

module.exports = (spec) => {
  let that = new EventEmitter()
  let type = 'Response'

  Winston.level = spec.logLevel || 'info'

  Object.defineProperty(that, 'type', {
    get () {
      return type
    },
    set (value) {
      type = value
    }
  })

  // Mock methods by overriding them

  /** @function connect
   *
   *  @summary  Absorbs the connection request.
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
   *  @summary  Absorbs the send request. Raises a 'message' event on itself together with the response data.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  that.send = (data) => {
    Winston.log('info', '[MockZmqRequester] Simulating sending:', data)
    const jsonData = JSON.parse(data)
    const responseData = JSON.stringify(Common.createJsonResponse(jsonData, type))
    that.emit('message', responseData)
  }

  return that
}
