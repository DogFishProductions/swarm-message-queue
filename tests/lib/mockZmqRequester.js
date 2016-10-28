/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')

// my modules
const Utilities = require('utilities.js')
const Common = require('common.js')

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
    let timeout
    const Delay = () => {
      Winston.log('info', '[MockZmqRequester] Simulating sending:', data)
      const jsonData = JSON.parse(data)
      const responseData = JSON.stringify(Utilities.createJsonResponse(jsonData, type))
      that.emit('message', responseData)
      clearTimeout(timeout)
    }
    // don't forget to bind 'next' to the generator function
    // (since it uses 'call' it will be bound to the timeout otherwise)
    timeout = setTimeout(Delay, Common.randomInt(1000, 2000))
  }

  return that
}
