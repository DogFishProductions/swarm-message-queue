/* Copyright (c) 2016 Paul Nebel */

'use strict'

const Winston = require('winston')
const Maybe = requre('data.maybe')

const ModuleLoader = require('moduleLoader')
const utilities = require('./common')

/**
 * A superclass for API endpoints. Defines common methods and parameters.
 */

/** @function
 *
 *  @summary APIEndpoint constructor.
 *
 *  @since 1.0.0
 *
 *  @param  {Object}  spec - A configuration specification.
 *  @param  {Object}  spec.modules - A collection of modules.
 *  @param  {Object}  spec.app - The application object.
 *
 *  @returns  {Object} The APIEndpoint.
 */
module.exports = (spec) => {
  // a validator to check that we're not calling an method we
  // shouldn't be. Add methods to this array as appropriate
  // (e.g. 'post', 'put', 'del' etc.)
  const ValidMethods = ['get']

  const HandlerInstances = {}

  // Inversion of Control
  const App = spec.app

  const assignParamValue = (param, module) => {
    param = module
    return param
  }

  Winston.level = spec.logLevel || 'info'

  let that = {}

  /** @function addHandler
   *
   *  @summary Adds an handler function to the endpoint that actually does the work.
   *           This function must return a promise.
   *
   *  @since 1.0.0
   *
   *  @param  {Function}  handler - The name of the function to invoke.
   *  @param  {Function}  method - The HTTP method used to connect (e.g. 'get', 'post', 'put', 'del').
   *  @param  {Function}  path - The relative URL of the endpoint.
   *
   *  @returns  {Object} The APIEndpoint.
   */
  const addHandler = (handler, method, path) => {
    // make sure the method is valid
    if (ValidMethods.indexOf(method) >= 0) {
      // add the endpoint to express
      App[method](
        spec.webHost.apiPathPrefix + path, 
        (req, res) => {
          // pass the parameters to the subclass so that they have access to the
          // request and response
          let params = that.getParams(req, res)
          // the result is an array so spread it to the handler function
          handler(...params)
          .done(
            result => {
              Winston.log('debug', '[APIEndpoint] json results received:', result)
              res.json(result)
            },
            err => res.status(500).send(err)
          )
        }
      )
    } else {
      throw new Error('API Endpoint at "' + path + '" does not understand method "' + method + '"')
    }
    // allow for cascade
    return that
  }

  /** @function getParams
   *
   *  @summary  Default implementation. Returns an empty array.
   *            Override as appropriate in subclasses.
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  req - The request object.
   *  @param  {Object}  res - The response object.
   *
   *  @returns  {Object} The APIEndpoint.
   */
  that.getParams = (req, res) => {
    // default implementation is to return an empty array
    return []
  }

  /** @function addHandlers
   *
   *  @summary Adds the handlers for each api endpoint.
   *           This function must return a promise.
   *
   *  Loads the modules defining the services to be added as handlers. Adds these service instances to the list of handler instances
   *  if they are not already included in this list. Adds the service as a handler for this endpoint as defined by the associated settings.
   *
   *  @since 1.0.0
   *
   *  @param  {Function}  options - An object containing the parameters for this function.
   *  @param  {Function}  options.modules - An object containing the filenames of the services to be added as handlers, keyed by service.
   *  @param  {Function}  options.spec - The app configuration (contains module configurations).
   *  @param  {Function}  options.handlerSettingsArray - An array of objects defining the settings for each handler service.
   *
   *  @returns  {Object} The APIEndpoint.
   */
  that.addHandlers = (options) => {
    ModuleLoader.loadModules(options)
    .done(
      modules => {
        let instance, serviceKey, handlerSettings
        for (handlerSettings of options.handlerSettingsArray) {
          serviceKey = handlerSettings.service
          instance = Maybe.fromNullable(HandlerInstances[serviceKey])
            .getOrElse(utilities.assignParamValue(HandlerInstances[serviceKey] = modules[serviceKey](options.spec))
          addHandler(instance[handlerSettings.function], handlerSettings.method, handlerSettings.path)
        }
      },
      err => {
        throw err
      }
    )
  }

  that.handlerInstances = () => {
    return HandlerInstances
  }

  return that
}
