/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
// this could be moved to the config file...
const Requester = require('Zmq').socket('req')

// my modules
// configuration file
const Config = require('configurationManager.js').config
const MqManager = require('mqManager.js')
const Services = {}

const MqName = Config.services['requester-manager'].handler

// Inversion of Control for requester...
Config.concreteRequester = Requester

Services[MqName] = MqManager.getMq(MqName, Config)
