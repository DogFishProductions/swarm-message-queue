/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
// this could be moved to the config file...
const Requester = require('Zmq').socket('req')
const Winston = require('winston')

// my modules
const Config = require('config.js')
const ServiceManager = require('serviceManager.js')

const Services = {}
const MqName = Config.services.requesterManager.handler
Winston.level = Config.logLevel || 'info'

// Inversion of Control for requester...
Config.concreteRequester = Requester

ServiceManager.getService(MqName, Config)
.done(
  service => {
    Services[MqName] = service
  },
  err => {
    Winston.log('error', '[RequesterManager] couldn\'t load requester', err)
    exit(1)
  }
)
