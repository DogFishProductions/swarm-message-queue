/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Cluster = require('cluster')
const Zmq = require('Zmq')
const Uuid = require('node-Uuid')
const Q = require('q')
const Net = require('net')
const _ = require('lodash')
const Util = require('util')

module.exports = (spec) => {
  const NoProc = spec.processes
  const Filename = spec.filename
  const Timeout = spec.timeout
  const Deferreds = {}
  let that = {}

  if (Cluster.isMaster) {
    const Connections = {}
    const port = spec.listenPort

    // listen on a socket
    const Server = Net.createServer((connection) => {
      console.log('[Requester:Master] socket subscriber listening')
      connection.uuid = Uuid.v4()
      Connections[connection.uuid] = connection
      connection.on('close', () => {
        console.log('[Requester:Master] socket subscriber disconnected')
        delete Connections[connection.uuid]
      })
      connection.on('data', (data) => {
        console.log("[Requester:Master] received data from socket: " + data)
        that.makeRequest(data.toString())
        .done(
          (results) => {
            console.log("RESULTS (2): " + Util.inspect(results))
            let msg = { requestId: results[0].requestId, msg: results }
            connection.write(JSON.stringify(msg))
          },
          (err) => {
            connection.write(err)
          }
        )
      })
    }).listen(port, () => {
      console.log('[Requester:Master] Listening for socket subscribers on ' + port)
    })

    // listen for workers to come online
    Cluster.on('online', (worker) => {
      console.log('[Requester:Master] Worker ' + worker.process.pid + ' is online.')
    })

    that.makeRequest = (requestId) => {
      let worker
      // get requesters to fire processes in parallel
      return Q.all(_.toPairs(Cluster.workers).map((kvp) => {
        let Deferred = Q.defer()
        const MessageId = Uuid.v4()
        Deferreds[MessageId] = Deferred
        worker = kvp[1]
        console.log('[Requester:Master] sending messageId to worker: ' + kvp[0])
        worker.send({ requestId: requestId, messageId: MessageId })
        return Deferred.promise
      })
    )}

    // fork worker processes
    for (let i = 0; i < NoProc; i++) {
      let worker = Cluster.fork()
      worker.on('message', (msg) => {
        console.log('[Requester:Master] response from worker: ' + Util.inspect(msg))
        const MId = msg.messageId
        if (MId) {
          const Deferred = Deferreds[MId]
          Deferred.resolve(msg)
          delete Deferreds[MId]
        }
      })
    }
  } else {
    const Requester = Zmq.socket('req')
    const RequesterId = Uuid.v4()
    const Timeouts = {}

    process.on('message', function (msg) {
      console.log('[Requester:Worker] ' + RequesterId + ' got a message from the Master: ' + msg)
      that.makeRequest(msg)
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
      console.log('[Requester:Worker] Received response from Responder:', Response)
      clearTimeout(Timeouts[messageId])
      Deferred.resolve(Response)
      delete Timeouts[messageId]
      delete Deferreds[messageId]
    })

    let connection = spec.connection
    console.log('[Requester:Worker] connecting as Requester: ' + RequesterId)
    Requester.connect(connection.protocol + '://' + connection.domain + ':' + connection.port)

    // send request for content
    that.makeRequest = (message) => {
      const MessageId = message.messageId
      const RequestId = message.requestId
      const At = Date.now().toString()
      const Deferred = Q.defer()
      Deferreds[MessageId] = Deferred
      console.log('[Requester:Worker] Sending request: ' + RequestId + ' as: ' + RequesterId + ' and messageId: ' + MessageId + ' for ' + Filename + ' at: ' + At)
      Requester.send(JSON.stringify({
        requestId: RequestId,
        requesterId: RequesterId,
        messageId: MessageId,
        path: Filename,
        at: At
      }))
      Timeouts[MessageId] = setTimeout(() => { Deferreds[MessageId].reject('request: ' + MessageId + ' timed out.') }, Timeout)
      return Deferred.promise
    }
  }

  return that
}