'use strict'

const
  FS = require('fs'),
  ZMQ = require('zmq'),
  RESPONDER = ZMQ.socket('rep');

// handle incoming requests
RESPONDER.on('message', (data) => {

  // parse incoming message
  let _request = JSON.parse(data)
  console.log('Received request to get: ' + _request.path)

  // read file and reply with content
  FS.readFile(_request.path, (err, content) => {
    console.log('sending request content');
    RESPONDER.send(JSON.stringify({
      content: content.toString(),
      timestamp: Date.now(),
      pid: process.pid
    }))
  })
})

// listen on TCP port 5433
RESPONDER.bind('tcp://*:5433', (err) => {
  // should handle errors here...
  console.log('Listening for zmq requesters...')
})

// close the reponder when the Node process ends
process.on('SIGINT', () => {
  console.log('Shutting down...')
  RESPONDER.close()
})