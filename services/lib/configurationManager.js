/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * DESCRIPTION
 */

const Nconf = require('nconf')

// get the appropriate configuration file
Nconf.env()
// err on the safe side and assume default of 'development' rather than 'production'
const NodeEnv = Nconf.get('NODE_ENV') || 'development'
Nconf.remove('file')
Nconf.use('file', { file: process.cwd() + '/config/' + NodeEnv + '/config.json' })
const Config = Nconf.stores.file.store

module.exports = (spec) => {
  let that = {}

  Object.defineProperty(that, 'config', {
    get: () => {
      return Config
    }
  })

  return that
}