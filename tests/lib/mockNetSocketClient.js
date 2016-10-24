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
const Common = require('utilities.js')

module.exports = (spec) => {
  Winston.level = spec.logLevel || 'info'
  
  let that = new EventEmitter()

  // spoof these attributes to pass test in socket service.
  that._handle = true
  that.writable = true

  /** @function connect
   *
   *  @summary  Absorbs the connect request. Runs the supplied callback.
   *
   *  @since 1.0.0
   *
   *  @param  {Number}  port - The desired connection port.
   *  @param  {String}  host - The desired connection host.
   *  @param  {Function}  callback - The callback to be run on connection.
   *
   */
  that.connect = (port, host, callback) => {
    Winston.log('info', '[MockNetSocket] Simulating connect to:', { port: port, host: host })
    callback()
  }

  /** @function write
   *
   *  @summary  Absorbs the write request. Triggers a data response event.
   *
   *  @since 1.0.0
   *
   *  @param  {String}  data - The response data.
   *
   */
  that.write = (data) => {
    Winston.log('info', '[MockNetSocket] Simulating sending:', data)
    const Response = []
    const Message = {}
    Message[data] = []
    for (let i = 0; i < spec.services['requester-cluster'].processes; i++) {
      Message[data].push(Common.createJsonResponseMessage())
    }
    Response.push(Message)
    that.emit('data', JSON.stringify(Response))
  }

  return that
}