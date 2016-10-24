/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

const Nconf = require('nconf')
const Path = require('path')
const Fs = require('fs')
const Winston = require('winston')
const _ = require('lodash')

Winston.level = 'info'

// get the appropriate configuration file
Nconf.env()
// err on the safe side and assume default of 'development' rather than 'production'
const NodeEnv = Nconf.get('NODE_ENV') || 'development'

Nconf.remove('defaults')

let contents
try {
  contents = Fs.readFileSync(Path.join(process.cwd(), '/config/', NodeEnv, '/config.json')).toString()
}
catch (err) {
  Winston.log('error', 'Trouble loading configuration files:', err)
  contents = '{}'
}

const Overrides = JSON.parse(contents)
Nconf.file('defaults', Path.join(process.cwd(), '/config/config.json'))

const Config = _.merge( Nconf.stores.defaults.store, Overrides )
Config.NodeEnv = NodeEnv

module.exports.config = Config
