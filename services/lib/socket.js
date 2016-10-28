/* Copyright (c) 2016 Paul Nebel */

'use strict'

// third-party modules
const Q = require('q')
const Uuid = require('node-Uuid')
const _ = require('lodash')
const Winston = require('winston')
const Path = require('path')

module.exports = (spec) => {
  const SocketSpec = spec.services[Path.parse(module.filename).name]
  const Deferreds = {}
  const Host = SocketSpec.connection.host
  const Port = SocketSpec.connection.port
  // Inversion of Control
  const Client = spec.concreteSocketClient

  let that = {}
  let connected = false
  let deferred // this one's for establishing connections only

  Winston.level = spec.logLevel || 'info'

  that.connect = () => {
    deferred = Q.defer()
    if (!connected) {
      Client.connect(Port, Host, () => {
        connected = true
        Winston.log('info', '[Socket] Client connected:', { host: Host, port: Port })
        deferred.resolve({ connected: true, msg: 'Socket connected to: ' + Port + ' on ' + Host })
      })
    } else {
      deferred.resolve({ connected: true, msg: 'Socket connected to: ' + Port + ' on ' + Host })
    }
    return deferred.promise
  }

  Client.on('data', (data) => {
    Winston.log('debug', '[Socket] Client received:', { data: data })
    const response = JSON.parse(data)
    _.forOwn(response, (value, key) => {
      Deferreds[key].resolve(response)
      delete Deferreds[key]
    })
  })

  Client.on('close', () => {
    connected = false
    Winston.log('debug', '[Socket] closed.')
  })

  Client.on('end', () => {
    connected = false
    Winston.log('debug', '[Socket] ended.')
  })

  Client.on('timeout', () => {
    Winston.log('warn', '[Socket] timed out.')
  })

  Client.on('error', (err) => {
    Winston.log('error', '[Socket] error:', { err: err })
    if (deferred) {
      deferred.reject({ connected: false, msg: err })
      deferred = null
    }
  })

  that.makeRequest = (data) => {
    const Deferred = Q.defer()
    if (Client._handle && Client.writable) {
      const RequestId = Uuid.v4()
      Deferreds[RequestId] = Deferred
      Client.write({ requestId: RequestId })
    } else {
      let err = '[Socket] There\'s a problem with the Client socket: '
      if (!Client._handler) {
        err += 'There\'s no handler; '
      }
      if (!Client.writable) {
        err += 'It\'s not writable; '
      }
      err += 'Try connecting the socket before making this request again.'
      Deferred.reject(err)
    }
    return Deferred.promise
  }

  return that
}
