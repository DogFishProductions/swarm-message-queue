/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Uuid = require('node-Uuid')

const CreateJsonRequest = (filename) => {
  return {
    requestId: Uuid.v4(),
    requesterId: Uuid.v4(),
    messageId: Uuid.v4(),
    filename: filename,
    requestedAt: Date.now()
  }
}

const CreateJsonResponse = (data, type) => {
  type = type || 'Response'
  return {
    requestId: data.requestId,
    requesterId: data.requesterId,
    messageId: data.messageId,
    body: 'This is a mock response',
    requestedAt: data.requestedAt,
    respondedAt: Date.now(),
    responderId: 123,
    responseType: type
  }
}

const CreateJsonResponseMessage = (type) => {
  type = type || 'Response'
  return {
    requesterId: Uuid.v4(),
    messageId: Uuid.v4(),
    body: 'This is a test',
    requestedAt: Date.now(),
    respondedAt: Date.now(),
    responderId: 123,
    responseType: type
  }
}

module.exports.createJsonRequest = CreateJsonRequest
module.exports.createJsonResponse = CreateJsonResponse
module.exports.createJsonResponseMessage = CreateJsonResponseMessage