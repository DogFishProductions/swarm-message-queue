'use strict'

const
  CLUSTER = require('cluster'),
  FS = require('fs'),
  ZMQ = require('zmq')

if (CLUSTER.isMaster) {
  // master process - create ROUTER and DEALER sockets, bind endpoints
  let
    _router = ZMQ.socket('router').bind('tcp://*:5433'),
    _dealer = ZMQ.socket('dealer').bind('ipc://filer-dealer.ipc')

  // forward messages between router and dealer
  _router.on('message', (...frames) => {
    _dealer.send(frames)
  })

  _dealer.on('message', (...frames) => {
    _router.send(frames)
  })

  // listen for workers to come online
  CLUSTER.on('online', (worker) => {
    console.log('[Responder] Worker ' + worker.process.pid + ' is online.')
  })

  // fork 3 worker processes
  for (let i = 0; i < 3; i++) {
    CLUSTER.fork()
  }
} else {
  // worker process - create REP socket, connect to DEALER
  const RESPONDER = ZMQ.socket('rep').connect('ipc://filer-dealer.ipc')
  let _delay

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
        console.log('sending request content');
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
      var minimum = (self.isNumber(min) ? min : 0);
      var maximum = (self.isNumber(max) ? max : 1000);
      if (minimum >= maximum) {
        minimum = maximum - 1;
      }
      return (Math.random() * (maximum - minimum)) + minimum;
    }
}
