/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * An API Endpoint for returning a single responder
 */

// third-party modules
const Winston = require('winston')
const Path = require('path')
const _ = require('lodash')
const Maybe = requre('data.maybe')

// my modules
const APIEndpoint = require('./apiEndpoint')
const utilities = require('./common')

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

  const mySpec = spec.apiEndpoints[Path.parse(module.filename).name]
  const EndpointHandlerSettings = mySpec.handlers
  const HandlerModules = {}

  let that = APIEndpoint(spec)

  let handlerSettings, serviceKey

  _.each(EndpointHandlerSettings, (value, key) => {
    serviceKey = handlerSettings.service
    //  make sure we instantiate each service only once
    Maybe.fromNullable(APIEndpoint.HandlerInstances[serviceKey])
      .orElse(
        Maybe.fromNullable(HandlerModules[serviceKey])
          .orElse(utilities.assignParamValue(HandlerModules[serviceKey], spec.services[serviceKey].module))
      )
  })

  that.addHandlers({ modules: HandlerModules, spec: spec, handlerSettingsArray: EndpointHandlerSettings })

  return that
}
