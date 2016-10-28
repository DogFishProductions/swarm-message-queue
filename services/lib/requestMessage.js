'use strict'

/**
 * Description
 */

// third-party modules
const Uuid = require('node-Uuid')
const Winston = require('winston')
const Validator = require('validator')

module.exports = spec => {
  let config = spec || {}
  let that = {}

  // the id of each individual message
  that.messageId = id => {
    if (id && !Validator.isUUID(id.toString(), 4)) {
      throw new Error('messageId must be UUID version 4.')
    }
    config.messageId = id
    return that
  }

  // the id of the requester sending this individual message
  that.requesterId = id => {
    if (id && !Validator.isUUID(id.toString(), 4)) {
      throw new Error('requesterId must be UUID version 4.')
    }
    config.requesterId = id
    return that
  }

  // the id of the request that initiated creation of this message
  that.requestId = id => {
    if (id && !Validator.isUUID(id.toString(), 4)) {
      throw new Error('requestId must be UUID version 4.')
    }
    config.requestId = id
    return that
  }

  // the time the initial request was made
  that.requestedAt = dt => {
    if (dt && !Validator.isInt(dt.toString())) {
      throw new Error('requestedAt must be int.')
    }
    config.requestedAt = dt
    return that
  }

  that.toJSON = () => {
    if (!config.requestId) {
      throw new Error('requestId required.')
    }
    else if (!config.requesterId) {
      throw new Error('requesterId required.')
    }
    return config
  }

  // validate config values
  that.requestId(config.requestId)
  that.requesterId(config.requesterId)
  that.messageId(config.messageId || Uuid.v4())
  that.requestedAt(config.requestedAt || Date.now())

  return that
}