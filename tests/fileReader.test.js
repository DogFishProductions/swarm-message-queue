/* Copyright (c) 2016 Paul Nebel */

'use strict'

/**
 * Description
 */

// third-party modules
const Winston = require('winston')
const Expect = require('chai').expect

// my modules
const Validator = require('testValidator.js')
const Config = require('config.js')
const FileReader = require('fileReader.js')(Config)
const Utilities = require('utilities.js')

let pendingDone

describe('FileReader', function () {
  describe('Correct Filename', function () {
    it('On sending request should receive response', function (done) {
      pendingDone = done
      const NewMessage = Utilities.createJsonRequest({ filename: 'test.txt' })
      FileReader.doYourStuff(NewMessage)
      .done(
        function (response) {
          Expect(response.request.filename).to.equal('test.txt')
          Expect(response.result).to.equal('This is a test')
          pendingDone()
        },
        function (err) {
          pendingDone(err)
        }
      )
    })
  })

  describe('Incorrect Filename', function () {
    it('On sending request should receive error', function (done) {
      pendingDone = done
      const NewMessage = Utilities.createJsonRequest({ filename: 'incorrect filename' })
      FileReader.doYourStuff(NewMessage)
      .done(
        function (response) {
          Expect(null).to.exist
          pendingDone()
        },
        function (err) {
          Expect(err.request.filename).to.equal('incorrect filename')
          Expect(err.err.message).to.equal('ENOENT: no such file or directory, open \'incorrect filename\'')
          pendingDone()
        }
      )
    })
  })
})
