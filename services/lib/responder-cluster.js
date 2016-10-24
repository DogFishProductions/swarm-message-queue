/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Cluster = require('cluster')
const Zmq = require('zmq')
const Winston = require('winston')
const Path = require('path')

// my modules
const Common = require('common.js')

module.exports = (spec) => {
  const ResponderClusterSpec = spec.services[Path.parse(module.filename).name]
  const NoProc = ResponderClusterSpec.processes
  Winston.level = spec.logLevel || 'info'

  let that = {}

  if (CLUSTER.isMaster) {
    // master process - create ROUTER and DEALER sockets, bind endpoints
    // as master is most stable part of process  
    const Router = Zmq.socket('router').bind(Common.createUrl(ResponderClusterSpec.router.connection)),
    const Dealer = Zmq.socket('dealer').bind(Common.createUrl(ResponderClusterSpec.dealer.connection))

    // forward messages between router and dealer
    Router.on('message', (...frames) => {
      Dealer.send(frames)
    })

    Dealer.on('message', (...frames) => {
      Router.send(frames)
    })

    // listen for workers to come online
    Cluster.on('online', (worker) => {
      Winston.log('debug', '[Responder:Master] Worker online:', { workerPID: worker.process.pid })
    })

    // fork worker processes
    for (let i = 0; i < NoProc; i++) {
      Cluster.fork()
    }
  } else {
    const Handler = ResponderClusterSpec.handler
    const ResponderSpec = spec.services[Handler]
    ModuleLoader.loadModules({ modules: { requester: spec.modules.services[Handler] } })
    .done(
      (modules) => {
        ResponderSpec.logLevel = spec.logLevel
        // override the connection to suit the cluster dealer
        ResponderSpec.connection = ResponderClusterSpec.dealer.connection
        // An alternative concrete implementation of Requester may be passed in by the
        // code requiring this module. If so, use that implementation instead
        // of the default in this service. Note that the alternative must implement the
        // ZMQ Requester interface.
        ResponderSpec.responder = Responder
        Responder = modules.requester(ResponderSpec)
        // let the master know we're ready for action
        process.send({ response: 'ready' })
      },
      (err) => {
        throw err
      }
    )
  }

  return that
}
