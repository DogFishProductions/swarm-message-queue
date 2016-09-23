/* Copyright (c) 2016 Paul Nebel */
'use strict';

/**
 * Message Buffer superclass. Defines common methods and properties.
 */

const Events = require('events')
const Util = require('util')

/** @function
 *
 *  @summary  MessageBuffer constructor.
 *
 *  @since 1.0.0
 *
 *  @param  {Object}  spec - A specification object.
 *  @param  {Object}  spec.stream - The message stream to buffer.
 *
 *  @returns  {Object} The MessageBuffer.
 */
module.exports = (spec) => {
  let that = {}
  let stream = spec.stream
  let buffer = ''

  events.EventEmitter.call(that)
    stream.on('data', that.onData(data))
  }

  /** @function onData
   *
   *  @summary  Processes data and emits messages as a result. Default implementation (this code)
   *            is to simply pass through the data as it is received.
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  spec - A specification object.
   *  @param  {Object}  spec.stream - The message stream to buffer.
   *
   *  @returns  {Object} The MessageBuffer.
   */
  that.onData = function (data) {
    this.emit('message', data)
  }

  util.inherits(that, events.EventEmitter)

  return that
}
