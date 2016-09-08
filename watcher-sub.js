'use strict'

const
  ZMQ = require('zmq'),
  SUBSCRIBER = ZMQ.socket('sub')

SUBSCRIBER.subscribe('')

SUBSCRIBER.on('message', (data) => {
  let
    _message = JSON.parse(data),
    _date = new Date(_message.timestamp)
  console.log('File "' + _message.file + '" changed at ' + _date)
})

SUBSCRIBER.on('connect', (fd, ep) => {
  console.log('Connected to endpoint:', ep)
})

SUBSCRIBER.monitor(500, 0);
SUBSCRIBER.connect('tcp://publisher:5432')