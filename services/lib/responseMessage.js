'use strict'

/**
 * Description
 */

// third-party modules
const Uuid = require('node-Uuid')
const Winston = require('winston')
const Validator = require('validator')

// my modules
const RequestMessage = require('requestMessage.js')

module.exports = spec => {
  let config = spec || {}
  let request

  let that = {}
  const Types = {
    response: 'Response',
    error: 'Error'
  }

  that.responderId = id => {
    if (id && !Validator.isInt(id.toString())) {
      throw new Error('responderId must be integer.')
    }
    config.responderId = id
    return that
  }

  that.responseId = id => {
    if (id && !Validator.isUUID(id.toString(), 4)) {
      throw new Error('requesterId must be UUID version 4.')
    }
    config.requesterId = id
    return that
  }

  that.body = data => {
    if (data && (typeof data !== 'string')) {
      throw new Error('body must be string.')
    }
    config.body = data
    return that
  }

  that.asResponse = () => {
    config.responseType = Types.response
    return that
  }

  that.asError = () => {
    config.responseType = Types.error
    return that
  }

  that.types = () => {
    return Types
  }

  that.request = req => {
    if (req) {
      try {
        request = RequestMessage(req).toJSON()
      }
      catch(err) {
        throw err
      }
    }
    else {
      request = req
    }
    return that
  }

  that.respondedAt = dt => {
    if (dt && !Validator.isInt(dt.toString())) {
      throw new Error('respondedAt must be int.')
    }
    config.respondedAt = dt
    return that
  }

  that.toJSON = () => {
    if (!config.responseType) {
      throw new Error('responseType required.')
    }
    else if (!config.body) {
      throw new Error('body required.')
    }
    else if (!request) {
      throw new Error('request required.')
    }
    Object.assign(config, request)
    return config
  }

  // validate config values
  that.request(config.request)
  delete config.request
  that.responderId(config.responderId || -1)
  that.responseId(config.responseId || Uuid.v4())
  that.respondedAt(config.respondedAt || Date.now())

  return that
}