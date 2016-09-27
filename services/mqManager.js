/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

const _ = require('lodash')
// enable dynamic loading of modules
const ModuleLoader = require('./lib/moduleLoader.js')
const Services = []

module.exports = (spec) => {
  let that = {}
  let modules = {}
  let mqName = spec.mqName
  modules[mqName] = spec.modules.services[mqName]
  let mq
  ModuleLoader.loadModules({ modules: modules })
  .done(
    (modules) => {
      spec.modules = modules
      _.forOwn(modules, (value, key) => {
        if (key && (key === mqName)) {
          mq = value(spec.services[key])
          Services.push(mq)
        }
      })
    },
    (err) => {
      throw err
    }
  )
  Object.defineProperty(that, 'mq', {
    get: () => {
      return mq
    }
  })
}
