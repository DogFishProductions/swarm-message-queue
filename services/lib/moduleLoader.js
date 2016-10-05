/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A dynamic module loader.
 * Allows us to load a different database connector according to the value in the configuration file.
 * To be run once in server.js on startup.
 */

const Fs = require('fs')
const Q = require('q')
const Modules = {}
const _ = require('lodash')
const Winston = require('winston')

/** @function
 *
 *  @summary Loads the modules defined by the key value pairs. Puts the results in an object,
 *           pairing passed in keys with the loaded modules.
 *
 *  @since 1.0.0
 *
 *  @param  {Object}  spec - A specification object.
 *  @param  {Object[]}  spec.modules - An array of key/value pairs. The keys are reference names and values are the names of the module files to be loaded.
 *  @param  {String}  [spec.parentKey] - The parent key used to group modules.
 *
 *  @returns  {Promise} A Promise to load the required modules.
 */
module.exports.loadModules = (spec) => {
  const Result = Q.defer()
  const ParentKey = spec.parentKey
  const Kvps = spec.modules || []
  Winston.level = spec.logLevel || 'info'
  Q.all(
    _.toPairs(Kvps).map(
      (kvp) => {
        const Deferred = Q.defer()
        // assume only ever one key-value pair in each element of the argument array (error capture here)
        let name = kvp[0]
        let path = process.cwd() + kvp[1]
        if (path) {
          // make sure path is a reference to a file
          Q.nfcall(Fs.lstat, path)
          .done(
            (stat) => {
              if (stat.isFile()) {
                Winston.log('silly', 'Loading module', { path: path })
                if (ParentKey) {
                  Modules[ParentKey] = Modules[ParentKey] || {}
                  if (!Modules[ParentKey][name]) {
                    Modules[ParentKey][name] = require(path)
                  }
                } else if (!Modules[name]) {
                  Modules[name] = require(path)
                }
                Deferred.resolve(path)
              } else {
                throw new Error('Required path is not a file: ' + path)
              }
            },
            (err) => {
              Deferred.reject(err)
            }
          )
        } else {
          Deferred.resolve()
        }
        return Deferred.promise
      }
    )
  )
  .done(
    (result) => {
      Result.resolve(Modules)
    },
    (err) => {
      Result.reject(err)
    }
  )
  return Result.promise
}