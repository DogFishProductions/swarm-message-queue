/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A module that allows objects to automatically run handler functions in response to changes in property values.
 */

// third-party modules
const Cluster = require('cluster')
const Uuid = require('node-Uuid')
const Q = require('q')
const _ = require('lodash')
const Winston = require('winston')
const Util = require('util')

// we define this here so that it can be rewired during test
// rewire doesn't allow us to override const values, so this has to be a let (even though the value will not change)
// Note that this variable will only be set by a unit test.
let Requester
let Net = require('net')

// my modules
// enable dynamic loading of modules
const ModuleLoader = require('./moduleLoader.js')

module.exports = (spec) => {
  const RequesterClusterSpec = spec.services['requester-cluster']
  const NoProc = RequesterClusterSpec.processes
  const Timeout = RequesterClusterSpec.timeout
  const Deferreds = {}
  let count = 0
  let that = {}

  Winston.level = spec.logLevel || 'info'

  if (Cluster.isMaster) {
    const Connections = {}
    const port = RequesterClusterSpec.listenPort

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
    const MakeRequest = (data) => {
      const JsonData = JSON.parse(data)
      let worker
      const Result = Q.defer()
      // get requesters to fire processes in parallel
      Q.all(_.toPairs(Cluster.workers).map((kvp) => {
        let Deferred = Q.defer()
        const MessageId = Uuid.v4()
        Deferreds[MessageId] = Deferred
        worker = kvp[1]
        Winston.log('debug', '[Requester:Master] sending message to worker:', { messageId: MessageId, workerId: kvp[0] })
        JsonData.messageId = MessageId
        worker.send(JsonData)
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
    const RequesterSpec = spec.services.requester
    ModuleLoader.loadModules({ modules: { requester: spec.modules.services.requester } })
    .done(
      (modules) => {
        RequesterSpec.logLevel = spec.logLevel
        // An alternative concrete implementation of Requester may be passed in by the
        // code requiring this module. If so, use that implementation instead
        // of the default in this service. Note that the alternative must implement the
        // ZMQ Requester interface.
        RequesterSpec.requester = Requester
        Requester = modules.requester(RequesterSpec)
        // let the master know we're ready for action
        process.send({ response: 'ready' })
      },
      (err) => {
        throw err
      }
    )

    // handle requests from the Master requester
    process.on('message', function (msg) {
      Winston.log('debug', '[Requester:Worker] received message from Master:', msg)
      Requester.makeRequest(msg)
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
  }

  return that
}
