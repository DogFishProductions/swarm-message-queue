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
const RequestMessage = require('requestMessage.js')
const Validator = require('testValidator.js')
const Config = require('config.js')

describe('RequestMessage', function () {
  it('should throw error without requestId assignment', function (done) {
    try {
      const Request = RequestMessage().toJSON()
      done(new Error('didn\'t raise an exception'))
    }
    catch(err) {
      Expect(err.message).to.equal('requestId required.')
    }
    done()
  })
  it('should throw error without requesterId assignment', function (done) {
    try {
      const Request = RequestMessage({ requestId: Uuid.v4() }).toJSON()
      done(new Error('didn\'t raise an exception'))
    }
    catch(err) {
      Expect(err.message).to.equal('requesterId required.')
    }
    done()
  })
  it('should return message when requestId and requesterId provided', function (done) {
    try {
      const Request = RequestMessage({ requestId: Uuid.v4(), requesterId: Uuid.v4() }).toJSON()
      Validator.validateJsonRequest(Request, done)
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow requestId to be set explicitly', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4() }).requestId(RequestId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestId).to.equal(RequestId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should throw validation exception if requestId not UUID v4', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4() }).requestId(1234).toJSON()
      done(new Error('Expected exception to be raised'))
    }
    catch(err) {
      Expect(err.message).to.equal('requestId must be UUID version 4.')
      done()
    }
  })
  it('should allow requesterId to be set explicitly', function (done) {
    try {
      const RequesterId = Uuid.v4()
      const Request = RequestMessage({ requestId: Uuid.v4() }).requesterId(RequesterId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requesterId).to.equal(RequesterId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should throw validation exception if requesterId not UUID v4', function (done) {
    try {
      const Request = RequestMessage({ requestId: Uuid.v4() }).requesterId(12324).toJSON()
      done(new Error('Expected exception to be raised'))
    }
    catch(err) {
      Expect(err.message).to.equal('requesterId must be UUID version 4.')
      done()
    }
  })
  it('should allow both requestId and requesterId to be set explicitly', function (done) {
    try {
      const RequesterId = Uuid.v4()
      const RequestId = Uuid.v4()
      const Request = RequestMessage().requestId(RequestId).requesterId(RequesterId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requesterId).to.equal(RequesterId)
        Expect(Request.requestId).to.equal(RequestId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow requestId to be set explicitly in config', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4(), requestId: Uuid.v4() }).requestId(RequestId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestId).to.equal(RequestId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow messageId to be set explicitly', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4() }).messageId(Uuid.v4()).requestId(RequestId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestId).to.equal(RequestId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should throw validation exception if Uuid.v4() not UUID v4', function (done) {
    try {
      const MessageId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4() }).messageId(1234).requestId(Uuid.v4()).toJSON()
      done(new Error('Expected exception to be raised'))
    }
    catch(err) {
      Expect(err.message).to.equal('messageId must be UUID version 4.')
      done()
    }
  })
  it('should allow requestedAt to be set explicitly in config', function (done) {
    try {
      const RequestedAt = Date.now()
      const Request = RequestMessage({ requesterId: Uuid.v4(), requestedAt: RequestedAt}).requestId(Uuid.v4()).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestedAt).to.equal(RequestedAt)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow requestedAt to be set explicitly', function (done) {
    try {
      const RequestedAt = Date.now()
      const Request = RequestMessage({ requesterId: Uuid.v4() }).requestId(Uuid.v4()).requestedAt(RequestedAt).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestedAt).to.equal(RequestedAt)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should throw validation exception if requestedAt not integer', function (done) {
    try {
      const Request = RequestMessage({ requesterId: Uuid.v4() }).requestId(Uuid.v4()).requestedAt('today').toJSON()
      done(new Error('Expected exception to be raised'))
    }
    catch(err) {
      Expect(err.message).to.equal('requestedAt must be int.')
      done()
    }
  })
  it('should allow messageId to be reset explicitly', function (done) {
    try {
      const MessageId = Uuid.v4()
      const Request = RequestMessage({ requestId: Uuid.v4(), messageId: Uuid.v4(), requesterId: Uuid.v4() }).messageId(MessageId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.messageId).to.equal(MessageId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow requesterId to be reset explicitly', function (done) {
    try {
      const RequesterId = Uuid.v4()
      const Request = RequestMessage({ requestId: Uuid.v4(), requesterId: Uuid.v4() }).requesterId(RequesterId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requesterId).to.equal(RequesterId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })

  it('should allow requestId to be reset explicitly', function (done) {
    try {
      const RequestId = Uuid.v4()
      const Request = RequestMessage({ requesterId: Uuid.v4(), requestId: Uuid.v4() }).requestId(RequestId).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestId).to.equal(RequestId)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
  it('should allow requestedAt to be reset explicitly', function (done) {
    try {
      const RequestedAt = Date.now()
      const Request = RequestMessage({ requestId: Uuid.v4(), requesterId: Uuid.v4(), requestedAt: Date.now() }).requestedAt(RequestedAt).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.requestedAt).to.equal(RequestedAt)
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })

  it('should allow arbitrary properties to be added to the request', function (done) {
    try {
      const RequesterId = Uuid.v4()
      const Request = RequestMessage({ requestId: Uuid.v4(), requesterId: Uuid.v4(), filename: 'filename' }).toJSON()
      Validator.validateJsonRequest(Request, function() {
        Expect(Request.filename).to.equal('filename')
        done()
      })
    }
    catch(err) {
      done(err)
    }
  })
})