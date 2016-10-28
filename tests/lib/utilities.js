/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * description
 */

// third-party modules
const Uuid = require('node-Uuid')

// my modules
const RequestMessage = require('requestMessage.js')
const ResponseMessage = require('responseMessage.js')

const CreateJsonRequest = (options) => {
  try {
    return RequestMessage(Object.assign({ requestId: Uuid.v4(), requesterId: Uuid.v4() }, options)).toJSON()
  }
  catch(err) {
    throw err
  }
}

const CreateJsonResponse = (data, type) => {
  type = type || 'Response'
  try {
    const response = ResponseMessage().request(RequestMessage(data).toJSON()).body('This is a mock response')
    if (type === 'Error') {
      response.asError()
    }
    else {
      response.asResponse()
    }
    return response.toJSON()
  }
  catch(err) {
    throw err
  }
}

const CreateJsonResponseMessage = (type, requestId) => {
  type = type || 'Response'
  requestId = requestId || Uuid.v4()
  return CreateJsonResponse(CreateJsonRequest({ requestId: requestId }), type)
}

module.exports.createJsonRequest = CreateJsonRequest
module.exports.createJsonResponse = CreateJsonResponse
module.exports.createJsonResponseMessage = CreateJsonResponseMessage