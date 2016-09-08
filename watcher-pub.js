'use strict';

const
  fs = require('fs'),
  zmq = require('zmq'),

  filename = process.argv[2],

  publisher = zmq.socket('pub');

fs.watch(filename, () => {
  publisher.send(JSON.stringify({
    type: 'changed',
    file: filename,
    timestamp: Date.now()
  }));
});

if (!filename) {
  throw Error('A file to watch must be specified');
}

publisher.bind('tcp://*:5432', (err) => {
  console.log('Listening for zmq subscribers...');
})