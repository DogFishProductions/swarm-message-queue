/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Uuid = require('node-Uuid')
const Path = require('path')
const Q = require('q')
const Winston = require('winston')

// my modules
const Common = require('common.js')
const RequestMessage = require('requestMessage.js')
const ResponseMessage = require('responseMessage.js')

module.exports = (spec) => {
  const RequesterSpec = spec.services[Path.parse(module.filename).name]
  // Inversion of Control
  const Requester = spec.concreteRequester

  let that = {}

  Winston.level = spec.logLevel || 'info'
  const Timeout = RequesterSpec.timeout
  const Deferreds = {}
  const RequesterId = Uuid.v4()

  // connect the requester
  let connection = RequesterSpec.connection
  Winston.log('debug', '[Requester:Worker] connecting:', {
    requesterId: RequesterId,
    protocol: connection.protocol,
    domain: connection.domain,
    port: connection.port
  })
  Requester.connect(Common.createUrl(connection))

  /** @function makeRequest
   *
   *  @summary  Makes a request to the requester(s). Creates a promise that will either be resolved
   *            by timing out or by receiving a message containing the same messageId from the
   *            Responder (which means resolution will occur in a different function to this one).
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  message - The message to be sent to the requester(s).
   *  @param  {UUID}    message.requestId - The UUID of the socket request that triggered this worker
   *                    to send a message to the requester(s).
   *  @param  {UUID}    message.messageId - The UUID of the message created by this particular worker.
   *
   *  @returns  {Object} A Promise.
   */
  that.makeRequest = (message) => {
    const Deferred = Q.defer()
    let newMessage

    try {
      newMessage = RequestMessage(message).requesterId(RequesterId).toJSON()
    } catch (err) {
      throw err
    }
    const MessageId = newMessage.messageId
    Deferreds[MessageId] = Deferred
    // make the promise timeout if we don't get a response in time
    Deferred.promise.timeout(Timeout, 'request: ' + MessageId + ' timed out.')
    .done(
      () => {
        // in order for the timeout promise to have resolved the original promise
        // must have resolved so there's nothing more to do than delete it
        Common.extract(MessageId, Deferreds)
      },
      (err) => {
        Winston.log('error', '[Requester:Worker]', err.message)
        // remove the original request from the stack to prevent race conditions (i.e. if request
        // resolves successfully in the few microseconds it takes to run the rest of this function)
        const OriginalRequest = Common.extract(MessageId, Deferreds)
        // if the timeout has rejected then the original request will still be pending so resolve it
        if (OriginalRequest.promise.isPending()) {
          try {
            OriginalRequest.resolve(ResponseMessage().request(newMessage).body(err.message).asError().toJSON())
          } catch (err2) {
            OriginalRequest.reject(err2)
          }
        }
      }
    )

    Winston.log('debug', '[Requester:Worker] Sending request:', newMessage)
    Requester.send(JSON.stringify(newMessage))

    return Deferred.promise
  }

  // handle replies from responder(s)
  // Resolves the promise created in 'makeRequest' with the same messageId as the response
  Requester.on('message', (data) => {
    const Response = JSON.parse(data)
    const Deferred = Deferreds[Response.messageId]
    Winston.log('debug', '[Requester:Worker] Received response from Responder:', Response)
    if (Deferred) {
      Deferred.resolve(Response)
    }
  })

  return that
}
