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
const ModuleLoader = require('./lib/moduleLoader.js')
const Services = {}

module.exports = (spec) => {
  let that = {}
  let modules = {}
  let mqName = spec.mqName

  Winston.level = spec.logLevel || 'info'

  modules[mqName] = spec.modules.services[mqName]
  let mq, newSpec
  ModuleLoader.loadModules({ modules: modules })
  .done(
    (modules) => {
      spec.modules = modules
      _.forOwn(modules, (value, key) => {
        if (key && (key === mqName)) {
          newSpec = spec.services[key]
          newSpec.logLevel = spec.logLevel
          mq = value(newSpec)
          Services[mqName] = mq
        }
      })
    },
    (err) => {
      throw err
    }
  )

  that.getMq = function (name) {
    return Services[name]
  }
}
