/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Fs = require('fs')
const Zmq = require('Zmq')
const Responder = Zmq.socket('rep')
const Util = require('util')

module.exports = (spec) => {
  let that = {}
  let delay

  // handle incoming requests
  Responder.on('message', (data) => {
    // parse incoming message
    let request = JSON.parse(data)
    console.log('Received request to get: ' + request.path)
    // simulate time taken to do something before Responding
    delay = setTimeout(Respond, RandomTime(1000, 2000), request)
  })

  const Respond = (request) => {
    // read file and reply with content
    Fs.readFile(request.path, (err, content) => {
      console.log('sending request content');
      Responder.send(JSON.stringify({
        requestId: request.id,
        content: content.toString(),
        timestamp: Date.now(),
        pid: process.pid
      }))
    })
    clearTimeout(delay)
  }

  const RandomTime = (min, max) => {
    // set default values if necessary
    var minimum = (self.isNumber(min) ? min : 0);
    var maximum = (self.isNumber(max) ? max : 1000);
    if (minimum >= maximum) {
      minimum = maximum - 1;
    }
    return (Math.random() * (maximum - minimum)) + minimum;
  }

  // listen on TCP port
  let connection = spec.connection
  Responder.bind(connection.protocol + '://' + connection.domain + ':' + connection.port, () => {
    // should handle errors here...
    console.log('Listening for Zmq requesters on: ' + connection.protocol + '://' + connection.domain + ':' + connection.port + '...')
  })

  // close the reponder when the Node process ends
  process.on('SIGINT', () => {
    console.log('Shutting down...')
    Responder.close()
  })

  return that
}
