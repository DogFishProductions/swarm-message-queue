/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A module that allows objects to automatically run handler functions in response to changes in property values.
 */

const Cluster = require('cluster')
const Zmq = require('Zmq')
const Uuid = require('node-Uuid')
const Q = require('q')
// const Net = require('net')
const _ = require('lodash')
const Winston = require('winston')

// we define this here so that it can be rewired during test
// rewire doesn't allow us to override const values, so this has to be a let (even though the value will not change)
let Requester = Zmq.socket('req')
let Net = require('net')

module.exports = (spec) => {
  const NoProc = spec.processes
  const Filename = spec.filename
  const Timeout = spec.timeout
  const Deferreds = {}
  let count = 0
  let that = {}

  Winston.level = spec.logLevel || 'info'

  if (Cluster.isMaster) {
    // we don't need a reference to the Requester in the master
    Requester = null
    const Connections = {}
    const port = spec.listenPort

    const FormatResponse = (response) => {
      const Results = []
      const FormattedResponseEnvelope = {}
      for (let i = 0; i < response.length; i++) {
        const CurrentResponse = response[i]
        const FormattedResponse = {}

        if (!FormattedResponseEnvelope[CurrentResponse.requestId]) {
          FormattedResponseEnvelope[CurrentResponse.requestId] = []
        }
        _.forOwn(CurrentResponse, (value, key) => {
          if (key !== 'requestId') {
            FormattedResponse[key] = value
          }
        })
        FormattedResponseEnvelope[CurrentResponse.requestId].push(FormattedResponse)
      }
      _.forOwn(FormattedResponseEnvelope, (value, key) => {
        let newResult = {}
        newResult[key] = value
        Results.push(newResult)
      })
      return Results
    }

    // listen on a socket
    Net.createServer((connection) => {
      Winston.log('info', '[Requester:Master] socket subscriber listening:', { port: port })
      connection.uuid = Uuid.v4()
      Connections[connection.uuid] = connection

      // listen for connections closing
      connection.on('close', () => {
        Winston.log('debug', '[Requester:Master] socket subscriber disconnected.')
        delete Connections[connection.uuid]
      })

      // listen for data arriving at port
      connection.on('data', (data) => {
        Winston.log('debug', '[Requester:Master] received data from socket:', { requestId: data.toString() })
        MakeRequest(data.toString())
        .done(
          (results) => {
            connection.write(results)
          },
          (err) => {
            connection.write(err)
          }
        )
      })
    })
    .listen(port, () => {
      Winston.log('info', '[Requester:Master] Listening for socket subscribers:', { port: port })
    })

    // listen for workers to come online
    Cluster.on('online', (worker) => {
      Winston.log('debug', '[Requester:Master] Worker online:', { workerPID: worker.process.pid })
    })

    /** @function makeRequest
     *
     *  @summary  Makes a request to the worker(s). Each worker is a requester. Each request has a UUID that is
     *            passed from the Master originator to worker, from the worker to the responder, and back again.
     *            This allows us to link log messages related to a particular request.
     *
     *  @since 1.0.0
     *
     *  @param  {Function}  requestId - The UUID of the request.
     *
     *  @returns  {Object} A Promise.
     */
    const MakeRequest = (requestId) => {
      let worker
      const Result = Q.defer()
      // get requesters to fire processes in parallel
      Q.all(_.toPairs(Cluster.workers).map((kvp) => {
        let Deferred = Q.defer()
        const MessageId = Uuid.v4()
        Deferreds[MessageId] = Deferred
        worker = kvp[1]
        Winston.log('debug', '[Requester:Master] sending message to worker:', { messageId: MessageId, workerId: kvp[0] })
        worker.send({ requestId: requestId, messageId: MessageId })
        return Deferred.promise
      }))
      .done(
        (results) => {
          return Result.resolve(FormatResponse(results))
        },
        (err) => {
          return Result.reject(err)
        }
      )
      return Result.promise
    }

    // fork worker processes
    for (let i = 0; i < NoProc; i++) {
      let worker = Cluster.fork()
      worker.on('message', (msg) => {
        Winston.log('debug', '[Requester:Master] response from worker:', msg)
        const MId = msg.messageId
        if (MId) {
          const Deferred = Deferreds[MId]
          Deferred.resolve(msg)
          delete Deferreds[MId]
        } else if (msg.response === 'ready') {
          // for testing purposes only
          count += 1
          if (count === NoProc) {
            process.send({ response: 'workers ready' })
          }
        }
      })
    }
  } else {
    const RequesterId = Uuid.v4()
    const Timeouts = {}

    // handle requests from the Master requester
    process.on('message', function (msg) {
      Winston.log('debug', '[Requester:Worker] received message from Master:', { requesterId: RequesterId, msg: msg })
      MakeRequest(msg)
      .done(
        (results) => {
          process.send(results)
        },
        (err) => {
          err = err || 'something happened'
          process.send(err)
        }
      )
    })

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
    let connection = spec.connection
    Winston.log('debug', '[Requester:Worker] connecting:', {
      requesterId: RequesterId,
      protocol: connection.protocol,
      domain: connection.domain,
      port: connection.port
    })
    Requester.connect(connection.protocol + '://' + connection.domain + ':' + connection.port)

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
    const MakeRequest = (message) => {
      const MessageId = message.messageId
      const RequestId = message.requestId
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
  }

  return that
}
