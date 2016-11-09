/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Creates a Mock object to simulate a zmq responder
 * @class
 */

// third-party modules
const EventEmitter = require('events').EventEmitter
const Winston = require('winston')
const Uuid = require('uuid')

// my modules
const Utilities = require('utilities.js')

module.exports = (spec) => {
  let type
  let that = new EventEmitter()

  Object.defineProperty(that, 'type', {
    get () {
      return type
    },
    set (value) {
      type = value
    }
  })

  Winston.level = spec.logLevel || 'info'

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
    Winston.log('info', '[MockZmqRouter] Simulating bind to:', url)
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
    let newData = Utilities.createJsonResponse(Object.assign(JSON.parse(data[0]), { requesterId: Uuid.v4() }), that.type)
    that.emit('message', JSON.stringify(newData))
  }

  return that
}