/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

const Express = require('express')
const Morgan = require('morgan')
const App = Express()
const Nconf = require('nconf')
const _ = require('lodash')
// enable dynamic loading of modules
const ModuleLoader = require('./lib/moduleLoader.js')
const Util = require('util')

// get the appropriate configuration file
Nconf.env()
// err on the safe side and assume default of 'development' rather than 'production'
const NodeEnv = Nconf.get('NODE_ENV') || 'development'
Nconf.remove('file')
Nconf.use('file', { file: process.cwd() + '/config/' + NodeEnv + '/config.json' })
const Config = Nconf.stores.file.store

ModuleLoader.loadModules({ modules: [Config.modules.apiEndpoints], parentKey: 'apiEndpoints' })
.done(
  (modules) => {
    const Spec = { app: App }
    const Host = Config.host
    _.forOwn(modules.apiEndpoints, (value, key) => {
      if (key) {
        Spec.config = Config.apiEndpoints[key]
        Spec.config.host = Config.host
        Spec.config.modules = Config.modules
        Spec.config.name = key
        Spec.config.services = Config.services
        value(Spec)
      }
    })
    App.use(Morgan(NodeEnv))
    App.use(Express.static('public'))
    App.listen(Host.port, function () {
      console.log('ready for action on: ' + Host.protocol + "//:" + Host.domain + ":" + Host.port)
    })

    // simple endpoint test
    App.get('/', function (req, res) {
      res.send({ hello: 'world!' })
    })
  },
  (err) => {
    throw err
  }
)