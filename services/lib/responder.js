/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Path = require('path')
const Winston = require('winston')

// my modules
const Common = require('common.js')
const ResponseMessage = require('responseMessage.js')

module.exports = (spec) => {
  // get the configuration for this module
  const ResponderSpec = spec.services[Path.parse(module.filename).name]
  // Inversion of Control
  const Responder = spec.concreteResponder
  const Handler = spec.responderHandler

  let that = {}
  Winston.level = spec.logLevel || 'info'

  Responder.on('message', (data) => {
    // parse incoming message
    let request = JSON.parse(data)
    Winston.log('debug', '[Responder] received request:', request)
    Handler.doYourStuff(request)
    .done(
      response => Respond(response),
      err => Respond(err)
    )
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
  const Respond = (data) => {
    const Message = ResponseMessage()
    let response
    try {
      Message
      .request(data.request)
      .responderId(process.pid)
      if (data.err) {
        Message
        .body(data.err.message || 'Something went wrong')
        .asError()
      } else {
        Message
        .body(data.result)
        .asResponse()
      }
      response = JSON.stringify(Message.toJSON())
    } catch (err) {
      throw err
    }
    Winston.log('debug', '[Responder] sending response:', response)
    Responder.send(response)
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

  return that
}
