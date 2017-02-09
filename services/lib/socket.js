/* Copyright (c) 2016 Paul Nebel */

'use strict'

// third-party modules
const Q = require('q')
const Uuid = require('node-Uuid')
const _ = require('lodash')
const Winston = require('winston')
const Path = require('path')

// my modules
const ModuleLoader = require('moduleLoader.js')

module.exports = (spec) => {
  const SocketSpec = spec.services[Path.parse(module.filename).name]
  const Deferreds = {}
  const Host = SocketSpec.connection.host
  const Port = SocketSpec.connection.port

  let Client

  // Inversion of Control
  if (spec.concreteSocketClient) {
    Client = spec.concreteSocketClient
  } else {
    ModuleLoader.loadModules({ modules: { client: SocketSpec.module } })
    .done(
      modules => {
        Client = modules.client(spec)
      },
      err => {
        throw err
      }
    )
  }

  let that = {}
  let connected = false
  let deferred // this one's for establishing connections only

  Winston.level = spec.logLevel || 'info'

  that.connect = () => {
    Winston.info('[Socket] Received request to connect')
    deferred = Q.defer()
    if (!connected) {
      Winston.info('[Socket] Client attempting to connect:', { host: Host, port: Port })
      Client.connect(Port, Host, () => {
        connected = true
        Winston.info('[Socket] Client connected:', { host: Host, port: Port })
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
      Client.write(JSON.stringify({ requestId: RequestId }))
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
