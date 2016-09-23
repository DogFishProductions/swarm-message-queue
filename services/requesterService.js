/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * An API Endpoint for returning a single responder
 */

const APIEndpoint = require('./lib/apiEndpoint.js')
// enable dynamic loading of modules
const ModuleLoader = require('./lib/moduleLoader.js')
const _ = require('lodash')
const Util = require('util')

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
  const Config = spec.config
  const EndpointName = spec.name
  const EndpointHandler = Config.handler
  const HandlerModules = {}
  HandlerModules[EndpointHandler.service] = Config.modules.services[EndpointHandler.service]
  let handler

  let that = APIEndpoint(spec)

  /** @function getParams
   *
   *  @summary Overrided the default implementation. Returns the url
   *           parameter from the request query string.
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  req - The request object.
   *  @param  {Object}  res - The response object.
   *
   *  @returns  {Object} The APIEndpoint.
   */
  that.getParams = function (req, res) {
    return [req.query.url]
  }

  ModuleLoader.loadModules({ modules: [HandlerModules], parentKey: 'services' })
  .done(
    (modules) => {
      _.forOwn(modules.services, (value, key) => {
        if (key && (key === EndpointHandler.service)) {
          handler = value(Config.services[key].connection)
          that.addHandler(handler[EndpointHandler.method])
        }
      })
    },
    (err) => {
      throw err
    }
  )

  return that
}
