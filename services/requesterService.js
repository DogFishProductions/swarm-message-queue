/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * An API Endpoint for returning a single responder
 */

// third-party modules
const Winston = require('winston')

// my modules
const APIEndpoint = require('./lib/apiEndpoint.js')
const ModuleLoader = require('./lib/moduleLoader.js')

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
  const Config = spec.config
//  const EndpointName = spec.name
  const EndpointHandlers = Config.handlers
  const HandlerModules = {}
  let currentHandler
  for (let i = 0; i < EndpointHandlers.length; i++) {
    currentHandler = EndpointHandlers[i]
    HandlerModules[currentHandler.service] = Config.modules.services[currentHandler.service]
  }
  const Handlers = {}

  let that = APIEndpoint(spec)

  ModuleLoader.loadModules({ modules: HandlerModules, parentKey: 'services' })
  .done(
    (modules) => {
      let currentModule, currentService
      for (let i = 0; i < EndpointHandlers.length; i++) {
        currentHandler = EndpointHandlers[i]
        currentService = currentHandler.service
        currentModule = modules.services[currentService]
        if (!Handlers[currentService]) {
          let newSpec = Config.services[currentService].connection
          newSpec.logLevel = Winston.level
          Handlers[currentService] = currentModule(newSpec)
        }
        that.addHandler(Handlers[currentService][currentHandler.call], currentHandler.method, currentHandler.path)
      }
    },
    (err) => {
      throw err
    }
  )

  return that
}
