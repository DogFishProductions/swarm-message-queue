/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Cluster = require('cluster')
const Zmq = require('Zmq')
const Uuid = require('node-Uuid')
const Async = require('async')
const Q = require('q')
const Net = require('net')
const Util = require('util')

module.exports = (spec) => {
  const NoProc = spec.processes
  const Filename = spec.filename
  const Timeout = spec.timeout
  let that = {}
  let workers = []

  if (Cluster.isMaster) {
    const Connections = {}
    const port = spec.listenPort

    // listen on a socket
    const Server = Net.createServer((connection) => {
      console.log('subscriber listening')
      connection.uuid = Uuid.v4()
      Connections[connection.uuid] = connection
      connection.on('close', () => {
        console.log('subscriber disconnected')
        delete Connections[connection.uuid]
      })
      connection.on('data', (data) => {
        that.makeRequest()
        .done(
          (results) => {
            results.requestId = data
            connection.write(results)
          },
          (err) => {
            connection.write(err)
          }
        )
      })
    }).listen(port, () => {
      console.log('Listening for subscribers on ' + port)
    })

    // listen for workers to come online
    Cluster.on('online', (worker) => {
      console.log('[Requester] Worker ' + worker.process.pid + ' is online.')
      workers.push(worker)
    })

    that.makeRequest = () => {
      // don't wait for all workers to come online - we don't want to block the event loop if any fail
      const Deferred = Q.defer()
      // get requesters to fire processes in parallel
      Async.parallel(workers.map((worker, done) => {
        worker.makeRequest()
        .done(
          (result) => {
            done(null, result)
          },
          (err) => {
            done(err)
          }
        )
      }),
      (err, results) => {
        if (err) {
          Deferred.reject(err)
        } else {
          Deferred.resolve(results)
        }
      })
      return Deferred.promise
    }

    // fork worker processes
    for (let i = 0; i < NoProc; i++) {
      Cluster.fork()
    }
  } else {
    const Requester = Zmq.socket('req')
    const RequesterId = Uuid.v4()
    const Deferreds = {}
    const Timeouts = {}

    // handle replies from responder
    Requester.on('message', (data) => {
      const Response = JSON.parse(data)
      const Deferred = Deferreds[Response.messageId]
      console.log('Received response:', Response)
      clearTimeout(Timeouts[MessageId])
      Deferred.resolve(Response)
      delete Timeouts[MessageId]
      delete Deferreds[MessageId]
    })

    let connection = spec.connection
    console.log('connection for Worker (ID: ' + RequesterId + '): ' + Util.inspect(connection))
    Requester.connect(connection.protocol + '://' + connection.domain + ':' + connection.port)

    // send request for content
    that.makeRequest = () => {
      const At = Date.now().toString()
      const MessageId = Uuid.v4()
      const Deferred = Q.defer()
      Deferreds[MessageId] = Deferred
      console.log('Sending request with requesterId: ' + RequesterId + ' and messageId: ' + MessageId + ' for ' + Filename + ' at: ' + At)
      Requester.send(JSON.stringify({
        requesterId: RequesterId,
        messageId: MessageId,
        path: Filename,
        at: At
      }))
      Timeouts[MessageId] = setTimeout(() => { Deferreds[MessageId].reject() }, Timeout)
      return Deferred.promise
    }
  }

  return that
}