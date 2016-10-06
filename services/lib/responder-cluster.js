/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

const Cluster = require('cluster')
const Zmq = require('zmq')

module.exports = (spec) => {
  const NoProc = spec.processes
  let that = {}

  if (CLUSTER.isMaster) {
    // master process - create ROUTER and DEALER sockets, bind endpoints
    // as master is most stable part of process
//    const Router = Zmq.socket('router').bind('tcp://*:5433'),
//    const Dealer = Zmq.socket('dealer').bind('ipc://filer-dealer.ipc')

    const CreateURL(protocol, domain, port) {
      let conn = protocol + '://' + domain
      if (port) {
        conn = conn + ':' + port
      }
      return conn
    }
    
    const Router = Zmq.socket('router').bind(CreateUrl(spec.router.connection)),
    const Dealer = Zmq.socket('dealer').bind(CreateUrl(spec.Dealer.connection))

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
    // worker process - create REP socket, connect to DEALER
  //  const RESPONDER = ZMQ.socket('rep').connect('ipc://filer-dealer.ipc')
    const ResponderConfig = spec.Dealer.connection
    ResponderConfig.logLevel = spec.logLevel
    const Responder = require('./responder.js')(ResponderConfig)
  /*  let _delay

    RESPONDER.on('message', (data) => {
      // parse incoming request
      let _request = JSON.parse(data)
      console.log(process.pid + ' received request for: ' + _request.path)
      // simulate time taken to do something before responding
      _delay = setTimeout(RESPOND, RANDOM_TIME(1000, 2000), _request)
    })

    const
      RESPOND = (request) => {
        // read file and reply with content
        FS.readFile(request.path, (err, content) => {
          console.log('sending request content')
          RESPONDER.send(JSON.stringify({
            requestId: request.id,
            content: content.toString(),
            timestamp: Date.now(),
            pid: process.pid
          }))
        })
        clearTimeout(_delay)
      },
      RANDOM_TIME = (min, max) => {
        // set default values if necessary
        var minimum = (self.isNumber(min) ? min : 0)
        var maximum = (self.isNumber(max) ? max : 1000)
        if (minimum >= maximum) {
          minimum = maximum - 1
        }
        return (Math.random() * (maximum - minimum)) + minimum
      }//*/
  }

  return that
}
