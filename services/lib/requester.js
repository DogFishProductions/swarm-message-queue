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

module.exports = (spec) => {
  const RequesterSpec = spec.services[Path.parse(module.filename).name]

  let that = {}

  Winston.level = spec.logLevel || 'info'
  const Timeout = RequesterSpec.timeout
  const Deferreds = {}
  const RequesterId = Uuid.v4()
  const Timeouts = {}
  const Requester = spec.concreteRequester

  // handle replies from responder
  Requester.on('message', (data) => {
    const Response = JSON.parse(data)
    const messageId = Response.messageId
    const Deferred = Deferreds[messageId]
    Winston.log('debug', '[Requester:Worker] Received response from Responder:', Response)
    clearTimeout(Timeouts[messageId])
    Deferred.resolve(Response)
    delete Timeouts[messageId]
    delete Deferreds[messageId]
  })

  // connect to the requester(s)
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
   *  @summary  Makes a request to the requester(s).
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
    const MessageId = message.messageId
    const RequestId = message.requestId
    const Filename = message.filename
    const At = Date.now().toString()
    const Deferred = Q.defer()
    Deferreds[MessageId] = Deferred
    const newMessage = {
      requestId: RequestId,
      requesterId: RequesterId,
      messageId: MessageId,
      filename: Filename,
      requestedAt: At
    }
    Winston.log('debug', '[Requester:Worker] Sending request:', newMessage)
    Requester.send(JSON.stringify(newMessage))
    Timeouts[MessageId] = setTimeout(() => { Deferreds[MessageId].reject('request: ' + MessageId + ' timed out.') }, Timeout)
    return Deferred.promise
  }

  return that
}