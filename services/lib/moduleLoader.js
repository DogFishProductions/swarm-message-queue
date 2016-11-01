/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * A dynamic module loader.
 * Allows us to load a different database connector according to the value in the configuration file.
 * To be run once in server.js on startup.
 */

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
        const name = kvp[0]
        const path = kvp[1]
        Winston.log('silly', 'Loading module', { path: path })
        try {
          const mod = require(path)

          if (ParentKey) {
            Modules[ParentKey] = Modules[ParentKey] || {}
            if (!Modules[ParentKey][name]) {
              Modules[ParentKey][name] = mod
            }
          } else if (!Modules[name]) {
            Modules[name] = mod
          }
          Deferred.resolve()
        } catch (err) {
          Deferred.reject(err)
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
