/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
const _ = require('lodash')
const Winston = require('winston')
const Q = require('q')

// my modules
const ModuleLoader = require('moduleLoader.js')
const Services = {}

/** @function getService
 *
 *  @summary  Gets an instance of the required service module.
 *
 *  @since 1.0.0
 *
 *  @param  {String}  serviceName - The name of the service module to be instantiated.
 *  @param  {Object}  config - The configuration object.
 *
 *  @returns  {Object} An instance of the required service module.
 */
module.exports.getService = (serviceName, config) => {
  const Deferred = Q.defer()
  let modules = {}

  Winston.level = config.logLevel || 'info'

  if (!Services[serviceName]) {
    modules[serviceName] = config.services[serviceName].module
    ModuleLoader.loadModules({ modules: modules })
    .done(
      (modules) => {
        // now the modules are loaded, instantiate them with the relevant settings
        _.forOwn(modules, (value, key) => {
          if (key && (key === serviceName)) {
            Services[serviceName] = value(config)
          }
        })
        return Deferred.resolve(Services[serviceName])
      },
      (err) => {
        return Deferred.reject(err)
      }
    )
  }
  return Deferred.promise
}
