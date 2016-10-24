/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Fs = require('fs')
const Path = require('path')
const Winston = require('winston')

// we define this here so that it can be rewired during test
// rewire doesn't allow us to override const values, so this has to be a let (even though the value will not change)
//let Responder = Zmq.socket('rep')

// my modules
const Common = require('common.js')

module.exports = (spec) => {
  const ResponderSpec = spec.services[Path.parse(module.filename).name]
  const Responder = spec.concreteResponder
  let delay
  Winston.level = spec.logLevel || 'info'

  // handle incoming requests and applies a random delay to the response to simulate
  // work being done synchronously by a remote task
  Responder.on('message', (data) => {
    // parse incoming message
    let request = JSON.parse(data)
    Winston.log('debug', '[Responder] received request:', {
      requesterId: request.requesterId,
      messageId: request.messageId,
      filename: request.filename
    })
    // simulate time taken to do something before Responding
    delay = setTimeout(Respond, Common.randomInt(1000, 2000), request)

  })

  /** @function Respond
   *
   *  @summary  Responds to a request from requester(s).
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  request - The request.
   *  @param  {String}  request.filename - The name of the file whose contents are to be returned to the requester.
   *  @param  {UUID}    request.requestId - The UUID of the socket request that initiated this request.
   *  @param  {UUID}    request.requesterId - The UUID of the worker that made this request.
   *  @param  {UUID}    request.messageId - The UUID of the message created by the requesting worker.
   *  @param  {UUID}    request.requestedAt - The datetime at which the worker request originated.
   *
   *  @returns  {Object} A Promise.
   */
  const Respond = (request) => {
    // read file and reply with content
    Fs.readFile(request.filename, (err, content) => {
      let result, type
      if (err) {
        result = err
        type = 'Error'
      } else {
        result = content.toString()
        type = 'Response'
      }
      let response = JSON.stringify({
        requestId: request.requestId,
        requesterId: request.requesterId,
        messageId: request.messageId,
        body: result,
        requestedAt: request.requestedAt,
        respondedAt: Date.now(),
        responderId: process.pid,
        responseType: type
      })
      Winston.log('debug', '[Responder] sending response:', response)
      Responder.send(response)
    })
    clearTimeout(delay)
  }

  if (ResponderSpec.processes > 1) {
    // responder is not the most stable part of the connection and should connect
    Responder.connect(Common.createUrl(ResponderSpec.dealer.connection))
  } else {
    // responder is the most stable part of the connection and should bind
    Responder.bind(Common.createUrl(ResponderSpec.connection), () => {
      // should handle errors here...
      Winston.log('info', '[Responder] listening for Zmq requesters:', ResponderSpec.connection)
    })
  }

  // close the reponder when the Node process ends
  process.on('SIGINT', () => {
    Winston.log('info', '[Responder] shutting down...')
    Responder.close()
  })
}
