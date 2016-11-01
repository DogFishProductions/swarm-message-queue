/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
// this could be moved to the config file...
const Responder = require('Zmq').socket('rep')
const Winston = require('winston')

// my modules
const Config = require('config.js')
const ServiceManager = require('serviceManager.js')

const Services = {}
const MqName = Config.services.responderManager.handler
const ResponderHandlerName = Config.services[MqName].handler

Winston.level = Config.logLevel || 'info'

// Inversion of Control for responder...
Config.concreteResponder = Responder

ServiceManager.getService(ResponderHandlerName, Config)
.then(
  handler => {
    Config.responderHandler = handler
    return ServiceManager.getService(MqName, Config)
  }
)
.done(
  service => {
    Services[MqName] = service
  },
  err => {
    Winston.log('error', '[RequesterManager] couldn\'t load requester', err)
    process.exit(1)
  }
)
