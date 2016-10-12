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
  return (Math.random() * (maximum - minimum)) + minimum
}

const CreateUrl = (connection) => {
  let conn = connection.protocol + '://' + connection.domain
  if (connection.port) {
    conn = conn + ':' + connection.port
  }
  return conn
}

module.exports.randomInt = RandomInt
module.exports.createUrl = CreateUrl