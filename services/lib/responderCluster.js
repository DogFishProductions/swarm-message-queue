/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Cluster = require('cluster')
const Winston = require('winston')
const Path = require('path')
const _ = require('lodash')

// my modules
const Common = require('common.js')
const ModuleLoader = require('moduleLoader.js')

module.exports = (spec) => {
  const ResponderClusterSpec = spec.services[Path.parse(module.filename).name]
  const NoProc = ResponderClusterSpec.processes
  Winston.level = spec.logLevel || 'info'

  let that = {}
  let count = 0

  if (Cluster.isMaster) {
    // master process - create ROUTER and DEALER sockets, bind endpoints
    // as master is most stable part of process
    // Inversion of Control - note that this has to be passed in (i.e. not available from config.js)
    const Router = spec.concreteRouter.bind(Common.createUrl(ResponderClusterSpec.router.connection))
    const Dealer = spec.concreteDealer.bind(Common.createUrl(ResponderClusterSpec.dealer.connection))

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
      let worker = Cluster.fork()
      worker.on('message', (msg) => {
        Winston.log('debug', '[Responder:Master] response from worker:', msg)
        if (msg.response === 'ready') {
          // for testing purposes only
          count += 1
          if ((count === NoProc) && process.send) {
            process.send({ response: 'workers ready' })
          }
        }
      })
    }
  } else {
    const Handler = ResponderClusterSpec.handler
    // we need to keep a reference to the responder to stop it being garbage collected
    let Responder
    ModuleLoader.loadModules({ modules: { responder: spec.services[Handler].module } })
    .done(
      (modules) => {
        // Inversion of Control
        Responder = modules.responder(spec)
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
