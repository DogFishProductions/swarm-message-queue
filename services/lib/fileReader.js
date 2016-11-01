/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Fs = require('fs')
const Path = require('path')
const Q = require('q')
const Winston = require('winston')

// my modules
const Common = require('common.js')

module.exports = spec => {
  let that = {}
  Winston.level = spec.logLevel || 'info'

  // get the configuration for this module
  const ReaderSpec = spec.services[Path.parse(module.filename).name]

  that.doYourStuff = request => {
    Winston.log('debug', '[FileReader] received request to do my stuff', request)
    const Deferred = Q.defer()
    request.filename = request.filename || ReaderSpec.filename

    const ReadFile = options => {
      Fs.readFile(options.filename, (err, content) => {
        let result, type
        if (err) {
          return Deferred.reject({ request: request, err: err })
        } else {
          Winston.log('err', '[FileReader] received request to do my stuff', request)
          result = content.toString()
          Winston.log('debug', '[FileReader] responding to request with:', { request: request, result: result, type: type })
          return Deferred.resolve({ request: request, result: result })
        }
      })
    }

    Q.delay(Common.randomInt(ReaderSpec.minDelay, ReaderSpec.maxDelay))
    .then(ReadFile({ filename: request.filename, request: request }))
    .catch(err => {
      Winston.log('err', '[FileReader] failed to read file', err)
      Deferred.reject(err)
    })

    return Deferred.promise
  }

  return that
}
