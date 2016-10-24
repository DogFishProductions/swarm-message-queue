/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
const _ = require('lodash')
const Winston = require('winston')

// my modules
// enable dynamic loading of modules
const ModuleLoader = require('moduleLoader.js')
const Services = {}

/** @function getMq
 *
 *  @summary  Gets an instance of the required message queue module.
 *
 *  @since 1.0.0
 *
 *  @param  {String}  mqName - The name of the message queue module to be instantiated.
 *  @param  {Object}  config - The configuration object.
 *
 *  @returns  {Object} An instance of the required message queue module.
 */
module.exports.getMq = (mqName, config) => {
  let modules = {}

  Winston.level = config.logLevel || 'info'

  if (!Services[mqName]) {
    modules[mqName] = config.services[mqName].module
    ModuleLoader.loadModules({ modules: modules })
    .done(
      (modules) => {
        // now the modules are loaded, instantiate them with the relevant settings
        _.forOwn(modules, (value, key) => {
          if (key && (key === mqName)) {
            Services[mqName] = value(config)
          }
        })
      },
      (err) => {
        throw err
      }
    )
  }

  return Services[mqName]
}
