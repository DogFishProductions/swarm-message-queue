/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
const Express = require('express')
const Morgan = require('morgan')
const App = Express()
const _ = require('lodash')
const Winston = require('winston')
// this could be moved to the config file...
const SocketClient = require('Net')

// my modules
// configuration file
const Config = require('configurationManager.js').config
const ModuleLoader = require('moduleLoader.js')

Winston.level = Config.logLevel || 'info'
Config.concreteSocketClient = SocketClient

const ApiEndpointModules = {}
_.forOwn(Config.apiEndpoints, (value, key) => {
  ApiEndpointModules[key] = value.module
})

ModuleLoader.loadModules({ modules: ApiEndpointModules, parentKey: 'apiEndpoints', logLevel: Winston.level })
.done(
  (modules) => {
    const Host = Config.host
    _.forOwn(modules.apiEndpoints, (value, key) => {
      if (key) {
        Config.app = App
        value(Config)
      }
    })
    App.use(Morgan(Config.NodeEnv))
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
