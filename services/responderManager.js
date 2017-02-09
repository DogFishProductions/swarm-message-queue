/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
// this could be moved to the config file...
const Zmq = require('Zmq')
const Responder = Zmq.socket('rep')
const Dealer = Zmq.socket('dealer')
const Router = Zmq.socket('router')
const Winston = require('winston')

// my modules
const Config = require('config.js')
const ServiceManager = require('serviceManager.js')

const Services = {}
const MqName = Config.services.responderManager.handler

Winston.level = Config.logLevel || 'info'

// Inversion of Control...
Config.concreteResponder = Responder
Config.concreteDealer = Dealer
Config.concreteRouter = Router

ServiceManager.getService(MqName, Config)
.done(
  service => {
    Services[MqName] = service
  },
  err => {
    Winston.log('error', '[RequesterManager] couldn\'t load requester', err)
    process.exit(1)
  }
)
