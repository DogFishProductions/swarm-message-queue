'use strict'

const
  ZMQ = require('zmq'),
  FILENAME = process.argv[2],
  REQUESTER = ZMQ.socket('req')

// handle replies from responder
REQUESTER.on('message', (data) => {
  let _response = JSON.parse(data)
  console.log('Received response:', _response)
})

REQUESTER.on('connect', (fd, ep) => {
  console.log('connect, endpoint:', ep)
})
REQUESTER.on('connect_delay', (fd, ep) => {
  console.log('connect_delay, endpoint:', ep)
})
REQUESTER.on('connect_retry', (fd, ep) => {
  console.log('connect_retry, endpoint:', ep)
})
REQUESTER.monitor(500, 0);
REQUESTER.connect('tcp://responder:5433')

//send request for content
console.log('Sending request for ' + FILENAME)
REQUESTER.send(JSON.stringify({
  path: FILENAME
}))