/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const _ = require('lodash')

const RandomInt = (min, max) => {
  // set default values if necessary
  var minimum = (_.isNumber(min) ? min : 0)
  var maximum = (_.isNumber(max) ? max : 1000)
  if (minimum >= maximum) {
    minimum = maximum - 1
  }
  return parseInt((Math.random() * (maximum - minimum)) + minimum)
}

const CreateUrl = (connection) => {
  let conn = connection.protocol + '://' + connection.domain
  if (connection.port) {
    conn = conn + ':' + connection.port
  }
  return conn
}

const extract = (key, obj) => {
  const result = obj[key]
  delete obj.key
  return result
}

const assignParamValue = (param, module) => {
  param = module
  return param
}

module.exports.randomInt = RandomInt
module.exports.createUrl = CreateUrl
module.exports.extract = extract
module.exports.assignParamValue = assignParamValue
