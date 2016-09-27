/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Net = require('net')
const Q = require('q')
const Uuid = require('node-Uuid')
const Util = require('util')

module.exports = (spec) => {
  const Deferreds = {}
  const Host = spec.host
  const Port = spec.port
  let that = {}
  let client = new Net.Socket()
  let deferred // this one's for establishing connections only

  that.connect = () => {
    deferred = Q.defer() // this one's for establishing connections only
    client.connect(Port, Host, () => {
      console.log('client connected to ' + Port + ' on ' + Host)
      deferred.resolve('Socket connected to: ' + Port + ' on ' + Host)
    })
    return deferred.promise
  }

  client.on('data', (data) => {
    console.log('Socket client received: ' + data)
    const response = JSON.parse(data)
    const Id = response.requestId
    Deferreds[Id].resolve(response.msg)
    delete Deferreds[Id]
  })

  client.on('close', () => {
    console.log('Socket closed')
  })

  client.on('end', () => {
    console.log('Socket ended')
  })

  client.on('timeout', () => {
    console.log('Socket timed out')
  })

  client.on('error', (err) => {
    console.log('Socket error: ' + err)
    if (deferred) {
      deferred.reject(err)
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
      let err = 'There\'s a problem with the client socket: '
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