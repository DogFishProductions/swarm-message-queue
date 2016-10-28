/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Description
 */

// third-party modules
const Winston = require('winston')
const Uuid = require('node-Uuid')
const Expect = require('chai').expect

// my modules
const ResponseMessage = require('responseMessage.js')
const Validator = require('testValidator.js')
const Config = require('config.js')
const Types = ResponseMessage().types()
const TestBody = 'test text'
const RequestId = Uuid.v4()
const RequesterId = Uuid.v4()
const TestRequest = require('requestMessage')({ requestId: RequestId, requesterId: RequesterId }).toJSON()

describe('ResponseMessage', function () {
  it('should throw error without type assignment', function (done) {
    try {
      const Response = ResponseMessage({ request: TestRequest }).toJSON()
      done(new Error('didn\'t raise an exception'))
    }
    catch(err) {
      Expect(err.message).to.equal('responseType required.')
    }
    done()
  })
  it('should throw error without body assignment', function (done) {
    try {
      const Response = ResponseMessage({ request: TestRequest }).asResponse().toJSON()
      done(new Error('didn\'t raise an exception'))
    }
    catch(err) {
      Expect(err.message).to.equal('body required.')
    }
    done()
  })
  it('should throw error without request assignment', function (done) {
    try {
      const Response = ResponseMessage({ body: TestBody }).asResponse().toJSON()
      done(new Error('didn\'t raise an exception'))
    }
    catch(err) {
      Expect(err.message).to.equal('request required.')
    }
    done()
  })
  it('should set responderId to -1 without responderId assignment', function (done) {
    try {
      const Response = ResponseMessage({ body: TestBody, request: TestRequest }).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should return message when type, request and body provided', function (done) {
    try {
      const Response = ResponseMessage({ body: TestBody, request: TestRequest }).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow the type to be set explicitly', function (done) {
    try {
      const Response = ResponseMessage({ body: TestBody, request: TestRequest }).asError().toJSON()
      Validator.validateJsonResponse(Response, Types.error, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow the body to be set explicitly', function (done) {
    try {
      const Response = ResponseMessage({ request: TestRequest }).body(TestBody).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should set responderId to spec value', function (done) {
    try {
      const ResponderId = Math.floor(Math.random() * 100) + 1
      const Response = ResponseMessage({ body: TestBody, responderId: ResponderId, request: TestRequest }).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(ResponderId)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow the responderId to be set explicitly', function (done) {
    try {
      const ResponderId = Math.floor(Math.random() * 100) + 1
      const Response = ResponseMessage({ body: TestBody, request: TestRequest }).responderId(ResponderId).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(ResponderId)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow both body and responderId to be set explicitly', function (done) {
    try {
      const ResponderId = Math.floor(Math.random() * 100) + 1
      const Response = ResponseMessage({ request: TestRequest }).body(TestBody).responderId(ResponderId).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(ResponderId)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow the body to be reset explicitly', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Response = ResponseMessage({ body: 'something else', request: TestRequest }).body(TestBody).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow the responderId to be reset explicitly', function (done) {
    try {
      const ResponderId = Math.floor(Math.random() * 100)
      const Response = ResponseMessage({ body: TestBody, responderId: Math.floor(Math.random() * 100) + 1, request: TestRequest }).responderId(ResponderId).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(ResponderId)
        Expect(Response.body).to.equal(TestBody)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow arbitrary properties to be added to the response', function (done) {
    try {
      const Response = ResponseMessage({ body: TestBody, filename: 'filename', request: TestRequest }).asResponse().toJSON()
      Validator.validateJsonResponse(Response, Types.response, function(err) {
        if (err) {
          return done(err)
        }
        Expect(Response.responderId).to.equal(-1)
        Expect(Response.body).to.equal(TestBody)
        Expect(Response.filename).to.equal('filename')
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
})