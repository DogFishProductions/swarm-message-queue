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
const ModuleLoader = require('moduleLoader.js')

module.exports = (spec) => {
  // get the configuration for this module
  const ResponderSpec = spec.services[Path.parse(module.filename).name]
  const HandlerSpec = spec.services[ResponderSpec.handler]
  // Inversion of Control - note that this has to be passed in (i.e. not available from config.js)
  const Responder = spec.concreteResponder

  let Handler

  if (spec.responderHandler) {
    Handler = spec.responderHandler
  } else {
    ModuleLoader.loadModules({ modules: { handler: HandlerSpec.module } })
    .done(
      modules => {
        Handler = modules.handler(spec)
      },
      err => {
        throw err
      }
    )
  }

  let that = {}
  Winston.level = spec.logLevel || 'info'

  Winston.info('[Responder] connecting to ', Common.createUrl(ResponderSpec.connection))

  Responder
    .connect(Common.createUrl(ResponderSpec.connection), function (error) {
      if (error) {
        Winston.error('Router failed to connect socket: ' + error.message)
        process.exit(0)
      }
    })
    .on('message', (data) => {
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

  // close the reponder when the Node process ends
  process.on('SIGINT', () => {
    Winston.log('info', '[Responder] shutting down...')
    Responder.close()
  })

  return that
}
