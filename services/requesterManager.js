/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// my modules
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
const MqManager = require('./lib/mqManager.js')
const Services = {}
const MqName = 'requester'

Config.mqName = MqName

Services[MqName] = MqManager(Config).getMq(MqName)
