/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * An API Endpoint for returning a single responder
 */

// third-party modules
const Winston = require('winston')
const Path = require('path')

// my modules
const APIEndpoint = require('apiEndpoint.js')
const ModuleLoader = require('moduleLoader.js')

// make sure we get singleton handler instances
const HandlerInstances = {}

/** @function
 *
 *  @summary APIEndpoint constructor.
 *
 *  @since 1.0.0
 *
 *  @param  {Object}  spec - A specification object.
 *  @param  {Object}  spec.config - An endpoint configuration object.
 *  @param  {Object}  spec.config.connector - A connector to an external endpoint.
 *  @param  {Object}  spec.config.analyser - A sentiment analyser.
 *  @param  {Object}  spec.config.app - The application object.
 *  @param  {String}  spec.config.pathPrefix - The URL prefix for endpoints.
 *
 *  @returns  {Object} The APIEndpoint.
 */
module.exports = (spec) => {
  Winston.level = spec.logLevel || 'info'

  const DispatcherSpec = spec.apiEndpoints[Path.parse(module.filename).name]
  const EndpointHandlers = DispatcherSpec.handlers
  const HandlerServices = {}

  let currentServiceKey
  
  for (let i = 0; i < EndpointHandlers.length; i++) {
    currentServiceKey = EndpointHandlers[i].service
    //  make sure we instanciate each service only once
    if (!HandlerInstances[currentServiceKey] && !HandlerServices[currentServiceKey]) {
      HandlerServices[currentServiceKey] = spec.services[currentServiceKey].module
    }
  }

  let that = APIEndpoint(spec)

  ModuleLoader.loadModules({ modules: HandlerServices, parentKey: 'services' })
  .done(
    (modules) => {
      let currentSettings, currentModule, currentServiceKey, currentInstance
      for (let i = 0; i < EndpointHandlers.length; i++) {
        currentSettings = EndpointHandlers[i]
        currentServiceKey = currentSettings.service
        currentModule = modules.services[currentServiceKey]
        currentInstance = currentModule(spec)
        HandlerInstances[currentServiceKey] = currentInstance
        that.addHandler(currentInstance[currentSettings.function], currentSettings.method, currentSettings.path)
      }
    },
    (err) => {
      throw err
    }
  )

  return that
}
