const SUT = require('../logic/controllers/images.controller')
const chai = require('chai')
const {assert} = chai
const {expect} = chai
const mock = require('mock-fs')
// const fs = require('fs')
const {mockRequest, mockResponse} = require('mock-req-res')
let fakeReq = mockRequest()
let fakeRes = mockResponse()
const sinon = require('sinon')
const rewire = require('rewire')
const rwSUT = rewire('../logic/controllers/images.controller');

const nock = require('nock')
const Stream = require('stream')
const https = require('https')

describe.only('images controller', function() {
    // replaceUrlExt params are verified before in middlewware
    describe('replaceUrlExt()', function() {
        it('returns a string', function() {
            let result = SUT.replaceUrlExt('http://testurl.jpg', 'png')
            assert.typeOf(result, 'string')
        })
        it('swaps jpg ext for pneg', function() {
            let result = SUT.replaceUrlExt('http://testurl.jpg', 'png')
            //get file ext
            expect(result).to.equal('http://testurl.png')
        })
        it('swaps jpg ext for gif', function() {
            let result = SUT.replaceUrlExt('http://testurl.jpg', 'gif')
            //get file ext
            console.log
            expect(result).to.equal('http://testurl.gif')
        })
        it('swaps png ext for hello', function() {
            let result = SUT.replaceUrlExt('http://testurl.png', 'hello')
            //get file ext
            expect(result).to.equal('http://testurl.hello')
        })
    })
    
    describe('imageFormat()', function() {
        it('returns a string', function() {
            let result = SUT.imageFormat('https://example.jpg')
            assert.typeOf(result, 'string')
        })
        it('returns the correct type of image pm format', function() {
            let result = SUT.imageFormat('https://res.cloudinary.com/chris-del/image/upload/v1537584219/o0bfegw7lw6j89jhmi2g.gif')
            expect(result).to.equal('gif')
        })
        it('throws an error when given an input that is not a string', function() {
            expect(function() {
                SUT.imageFormat({test: 'me'})
            }).to.throw(TypeError, 'imageFormat error: imgSrc must be a string')
        })
    })
    describe('setImageQuality()', function() {
        let str = "https://res.cloudinary.com/chris-del/image/upload/q_auto:eco/v1538956118/lyhcprkx2dy9udtg40u2.jpg"
        it('returns a string', function() {
            let result = SUT.setImageQuality(str, 'high')
            assert.typeOf(result, 'string')
        })
        it('inserts low param into URL', function() {
            let result = SUT.setImageQuality(str, 'low')
            expect(result).to.equal('https://res.cloudinary.com/chris-del/image/upload/q_auto:low/v1538956118/lyhcprkx2dy9udtg40u2.jpg')
        })
        it('throws an error when given input params that are not strings', function() {
            expect(function() {
                let result = SUT.setImageQuality(10, 'high')
            }).to.throw(TypeError, 'ERROR: invalid input to setImageQuality')
        })
    })
    describe('httpCall()', function() {
        describe('httpCall returns a promise', function() {
            beforeEach(function() {
                let mockStream = new Stream.Transform()
                // stub get
                httpGet = sinon.stub(https, 'get').resolves(mockStream)
            })
            afterEach(function() {
                https.get.restore()
            })
            it('returns a promise', function() {
                //  let mockStream = new Stream.Transform()
                //   stub get
                // httpGet = sinon.stub(https, 'get').resolves(mockStream)
                let result = rwSUT.httpCall('fakePng.png', '100x100')
                let promise = result instanceof Promise
                expect(promise).to.be.true
            })

        })
    })
    describe('getCache()', function() {
        it('returns true', function() {
            let result = SUT.getCache([
                {
                    '100x100': Buffer.from([8,6,7,5,3,0,9])
                }
        ], '100x100')
            expect(result).to.be.true
        })
        it('returns false', function() {
            let result = SUT.getCache([
                {
                    '100x100': Buffer.from([8,6,7,5,3,0,9])
                }
        ], '200x200')
            expect(result).to.be.false
        })
        it('throws an error when a first arg is not passed an array', function() {
            expect(function() {
                SUT.getCache(44, '100x100')
            }).to.throw(TypeError, 'First input of getCache must be an array.')
        })
        it('throws an error when a second arg is not passed a string', function() {
            expect(function() {
                SUT.getCache([{'100x100': 'hello'}], 44)
            }).to.throw(TypeError, 'Second input of getCache must be a string.')
        })
    })

})
