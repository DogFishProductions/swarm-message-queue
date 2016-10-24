/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
// this could be moved to the config file...
const Responder = require('Zmq').socket('rep')

// my modules
// configuration file
const Config = require('configurationManager.js').config
const MqManager = require('mqManager.js')
const Services = {}

const MqName = Config.services['responder-manager'].handler

// Inversion of Control for responder...
Config.concreteResponder = Responder

Services[MqName] = MqManager.getMq(MqName, Config)
