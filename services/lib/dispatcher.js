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

  let that = APIEndpoint(spec)

  let handlerSettings, serviceKey

  for (handlerSettings of EndpointHandlerSettings) {
    serviceKey = handlerSettings.service
    //  make sure we instantiate each service only once
    if (!APIEndpoint.HandlerInstances[serviceKey] && !HandlerModules[serviceKey]) {
      HandlerModules[serviceKey] = spec.services[serviceKey].module
    }
  }

  that.addHandlers({ modules: HandlerModules, spec: spec, handlerSettingsArray: EndpointHandlerSettings })

  return that
}
