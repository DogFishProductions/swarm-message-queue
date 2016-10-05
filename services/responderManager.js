/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

// third-party modules
const Nconf = require('nconf')
const _ = require('lodash')

// my modules
// configuration file
const Config = require('../services/lib/configurationManager.js')().config
const MqManager = require('./mqManager.js')
const Services = {}
const MqName = 'responder'

/*
// get the appropriate configuration file
Nconf.env()
// err on the safe side and assume default of 'development' rather than 'production'
const NodeEnv = Nconf.get('NODE_ENV') || 'development'
Nconf.remove('file')
Nconf.use('file', { file: process.cwd() + '/config/' + NodeEnv + '/config.json' })
const Config = Nconf.stores.file.store//*/
Config.mqName = MqName

Services[MqName] = MqManager(Config).getMq(MqName)