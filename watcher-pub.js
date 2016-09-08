'use strict'

const
  FS = require('fs'),
  ZMQ = require('zmq'),
  FILENAME = process.argv[2],
  PUBLISHER = ZMQ.socket('pub')

FS.watch(FILENAME, () => {
  PUBLISHER.send(JSON.stringify({
    type: 'changed',
    file: FILENAME,
    timestamp: Date.now()
  }))
})

if (!FILENAME) {
  throw Error('A file to watch must be specified')
}

PUBLISHER.bind('tcp://*:5432', (err) => {
  // should handle errors here...
  console.log('Listening for zmq subscribers...')
})