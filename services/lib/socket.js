/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Net = require('net')
const Q = require('q')
const Uuid = require('node-Uuid')
const Winston = require('winston')

module.exports = (spec) => {
  const Deferreds = {}
  const Host = spec.host
  const Port = spec.port
  let that = {}
  let client = new Net.Socket()
  let connected = false
  let deferred // this one's for establishing connections only

  Winston.level = spec.logLevel || 'info'

  that.connect = () => {
    deferred = Q.defer()
    if (!connected) {
      client.connect(Port, Host, () => {
        connected = true
        Winston.log('info', '[Socket] client connected:', { host: Host, port: Port})
        deferred.resolve({ connected: true, msg: 'Socket connected to: ' + Port + ' on ' + Host })
      })
    } else {
      deferred.resolve({ connected: true, msg: 'Socket connected to: ' + Port + ' on ' + Host })
    }
    return deferred.promise
  }

  client.on('data', (data) => {
    Winston.log('debug', '[Socket] client received:', { data: data })
    const response = JSON.parse(data)

    for (let i = 0; i < response.msg.length; i++) {
      const Id = Object.keys(response.msg[i])[0]
      Deferreds[Id].resolve(response.msg[i][Id])
      delete Deferreds[Id]
    }
  })

  client.on('close', () => {
    connected = false
    Winston.log('debug', '[Socket] closed.')
  })

  client.on('end', () => {
    connected = false
    Winston.log('debug', '[Socket] ended.')
  })

  client.on('timeout', () => {
    Winston.log('warn', '[Socket] timed out.')
  })

  client.on('error', (err) => {
    Winston.log('error', '[Socket] error:', { err: err })
    if (deferred) {
      deferred.reject({ connected: false, msg: err })
      deferred = null
    }
  })

  that.makeRequest = () => {
    const Deferred = Q.defer()
    if (client._handle && client.writable) {
      const DeferredId = Uuid.v4()
      Deferreds[DeferredId] = Deferred
      client.write(DeferredId)
    }
    else {
      let err = '[Socket] There\'s a problem with the client socket: '
      if (!client._handler) {
        err += 'There\'s no handler; '
      }
      if (!client.writable) {
        err += 'It\'s not writable; '
      }
      err += 'Try connecting the socket before making this request again.'
      Deferred.reject(err)
    }
    return Deferred.promise
  }

  return that
}