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

/** @function
 *
 *  @summary APIEndpoint constructor.
 *
 *  @since 1.0.0
 *
 *  @param  {Object}  spec - A configuration specification object.
 *
 *  @returns  {Object} The APIEndpoint.
 */
module.exports = (spec) => {
  Winston.level = spec.logLevel || 'info'

  const DispatcherSpec = spec.apiEndpoints[Path.parse(module.filename).name]
  const EndpointHandlerSettings = DispatcherSpec.handlers
  const HandlerModules = {}

  let handlerSettings, serviceKey, handlerFunction
  
  for (handlerSettings of EndpointHandlerSettings) {
    serviceKey = handlerSettings.service
    handlerFunction = handlerSettings.function
    //  make sure we instantiate each service only once
    if (!HandlerInstances[serviceKey] && !HandlerModules[serviceKey])) {
      HandlerModules[serviceKey] = spec.services[serviceKey].module
    }
  }

  let that = APIEndpoint(spec)
  that.addHandlers({ modules: HandlerModules, spec: spec, handlerSettingsArray: EndpointHandlerSettings })

  return that
}
