/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
const Express = require('express')
const Morgan = require('morgan')
const App = Express()
const Nconf = require('nconf')
const _ = require('lodash')
const Winston = require('winston')

// my modules
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
// enable dynamic loading of modules
const ModuleLoader = require('./lib/moduleLoader.js')

/*
// get the appropriate configuration file
Nconf.env()
// err on the safe side and assume default of 'development' rather than 'production'
const NodeEnv = Nconf.get('NODE_ENV') || 'development'
Nconf.remove('file')
Nconf.use('file', { file: process.cwd() + '/config/' + NodeEnv + '/config.json' })
const Config = Nconf.stores.file.store//*/
Winston.level = Config.logLevel || 'info'

ModuleLoader.loadModules({ modules: Config.modules.apiEndpoints, parentKey: 'apiEndpoints', logLevel: Winston.level })
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
        Spec.logLevel = Config.logLevel
        value(Spec)
      }
    })
    App.use(Morgan(NodeEnv))
    App.use(Express.static('public'))
    App.listen(Host.port, function () {
      Winston.log('info', '[Server] ready for action.', {
        protocol: Host.protocol,
        domain: Host.domain,
        port: Host.port
      })
    })

    // simple endpoint test
    App.get('/', function (req, res) {
      res.send({ hello: 'world!' })
    })
  },
  (err) => {
    Winston.log('error', 'Application Exception', { err: err })
    throw err
  }
)