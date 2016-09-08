'use strict';

const
  zmq = require('zmq'),

  subscriber = zmq.socket('sub');

subscriber.subscribe('');

subscriber.on('message', (data) => {
  let
    _message = JSON.parse(data),
    _date = new Date(_message.timestamp);
  console.log('File "' + _message.file + '" changed at ' + _date);
})

subscriber.connect('tcp://publisher:5432');