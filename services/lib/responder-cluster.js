/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

const Cluster = require('cluster')
const Zmq = require('zmq')

module.exports = (spec) => {
  // my modules
  const Common = require('./common.js')
  const NoProc = spec.processes
  let that = {}

  if (CLUSTER.isMaster) {
    // master process - create ROUTER and DEALER sockets, bind endpoints
    // as master is most stable part of process  
    const Router = Zmq.socket('router').bind(Common.createUrl(spec.router.connection)),
    const Dealer = Zmq.socket('dealer').bind(Common.createUrl(spec.dealer.connection))

    // forward messages between router and dealer
    Router.on('message', (...frames) => {
      Dealer.send(frames)
    })

    Dealer.on('message', (...frames) => {
      Router.send(frames)
    })

    // listen for workers to come online
    Cluster.on('online', (worker) => {
      console.log('[Responder] Worker ' + worker.process.pid + ' is online.')
    })

    // fork worker processes
    for (let i = 0; i < NoProc; i++) {
      Cluster.fork()
    }
  } else {
    const ResponderConfig = spec.Dealer.connection
    ResponderConfig.logLevel = spec.logLevel
    const Responder = require('./responder.js')(ResponderConfig)
  }

  return that
}
