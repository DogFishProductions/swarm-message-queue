/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Net = require('net')
const Q = require('q')
const Uuid = require('node-Uuid')
const Util = require('util')

module.exports = (spec) => {
  const Deferreds = {}
  let that = {}
  let client = new Net.Socket()

  client.connect(spec.port, spec.host, () => {
    console.log('client connected to ' + spec.port + ' on ' + spec.host)
  })

  client.on('data', (data) => {
    console.log('Socket client received: ' + data)
    const Id = data.requestId
    Deferreds[Id].resolve(data)
    delete Deferreds[Id]
  })

  client.on('error', (err) => {
    console.log('Socket error: ' + err)
  })

  that.makeRequest = () => {
    const Deferred = Q.defer()
    const DeferredId = Uuid.v4()
    Deferreds[DeferredId] = Deferred
    client.write(DeferredId)
    return Deferred.promise
  }

  return that
}