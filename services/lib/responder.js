/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Fs = require('fs')
const Zmq = require('Zmq')
const Responder = Zmq.socket('rep')
const Util = require('util')

module.exports = (spec) => {
  let that = {}
  let delay

  // handle incoming requests
  Responder.on('message', (data) => {
    // parse incoming message
    let request = JSON.parse(data)
    console.log('[Responder] received request from: ' + request.requesterId + ' with messageId: ' + request.messageId + ' to get: ' + request.path)
    // simulate time taken to do something before Responding
    delay = setTimeout(Respond, RandomTime(1000, 2000), request)
  })

  const Respond = (request) => {
    // read file and reply with content
    Fs.readFile(request.path, (err, content) => {
      let result = content.toString()
      if (err) {
        result = err
      }
      console.log('[Responder] sending response');
      Responder.send(JSON.stringify({
        requestId: request.requestId,
        requesterId: request.requesterId,
        messageId: request.messageId,
        content: result,
        requestedAt: request.at,
        respondedAt: Date.now(),
        responderPid: process.pid
      }))
    })
    clearTimeout(delay)
  }

  /** @function isNumber
   *
   *  @summary  Checks whether a supplied parameter is a number or not.
   *
   *  @param    {number}  n - The value to be checked.
   *
   *  @since 1.0.0
   *
   *  @returns  {boolean}  'true' if value is a number, 'false' otherwise.
   */
  const isNumber = function(n) {
    return !Array.isArray(n) && !isNaN(parseFloat(n)) && isFinite(n);
  }

  const RandomTime = (min, max) => {
    // set default values if necessary
    var minimum = (isNumber(min) ? min : 0);
    var maximum = (isNumber(max) ? max : 1000);
    if (minimum >= maximum) {
      minimum = maximum - 1;
    }
    return (Math.random() * (maximum - minimum)) + minimum;
  }

  // listen on TCP port
  let connection = spec.connection
  Responder.bind(connection.protocol + '://' + connection.domain + ':' + connection.port, () => {
    // should handle errors here...
    console.log('[Responder] listening for Zmq requesters on: ' + connection.protocol + '://' + connection.domain + ':' + connection.port + '...')
  })

  // close the reponder when the Node process ends
  process.on('SIGINT', () => {
    console.log('[Responder] shutting down...')
    Responder.close()
  })

  return that
}
