const SUT = require('../logic/controllers/images.controller')
// const x = require('../public/javascripts/validation')
const chai = require('chai')
const {assert} = chai
const {expect} = chai
const mock = require('mock-fs')
// const fs = require('fs')
const {mockRequest, mockResponse} = require('mock-req-res')
const fakeReq = mockRequest()
const fakeRes = mockResponse()
const sinon = require('sinon')
const rewire = require('rewire')
const rwSUT = rewire('../logic/controllers/images.controller');
const mongoose = require('mongoose')
const Image = mongoose.models.Image || require('../models/image.model.js')

describe('images controller', function() {
    describe('replaceUrlExt()', function() {
        it('returns a string', function() {
            let result = SUT.replaceUrlExt('http://testurl.jpg', 'png')
            assert.typeOf(result, 'string')
        })
        it('returns a file with an ext the same as the input', function() {
            let result = SUT.replaceUrlExt('http://testurl.jpg', 'png')
            //get file ext
            let ext = result.split('.').pop()
            expect(ext).to.equal('png')
        })
        it('errors out when a passed a URL without and extension', function() {
            expect(function() {
                SUT.replaceUrlExt('a', 'png')
            }).to.throw(TypeError, 'Url is not has not extension. Must be jpg, png, or gif.')
        })
        it('errors out when given a new extentsion that is not valid', function() {
            expect(function() {
                SUT.replaceUrlExt('http://example.jpg', 'alt')
            }).to.throw(TypeError, 'Extension is not valid to replace url. Only png, jpg, and gif.')
        })
    })
    describe('addFile()', function() {
        it('returns an undefined', function() {
            // use mockRequest to set user session
            fakeRes = mockRequest({
                session: {
                    user: 'test user'
                }
            })
            let result = SUT.addFile(fakeReq, fakeRes)
            expect(result).to.equal(undefined)
        })
        it('will not run function without a user in the session', function() {
            fakeReq = mockRequest({
                session: {
                    user: ''
                }
            })
            let console = {
                log: sinon.spy(),
                error: sinon.spy()
            }
            rwSUT.__set__('console', console)
            // controller.__set('console', this.console)
            let result = rwSUT.addFile(fakeReq, fakeRes)
            expect(console.error.callCount).to.equal(1)

        })
    })
    describe('imageFormat()', function() {
        it('returns a string', function() {
            let result = SUT.imageFormat('https://example.jpg')
            assert.typeOf(result, 'string')
        })
        it('returns the correct type of image format', function() {
            let result = SUT.imageFormat('https://res.cloudinary.com/chris-del/image/upload/v1537584219/o0bfegw7lw6j89jhmi2g.gif')
            expect(result).to.equal('gif')
        })
        it('errors out when given an input that is not a string', function() {
            expect(function() {
                SUT.imageFormat({test: 'me'})
            }).to.throw(TypeError, 'imageFormat error: imgSrc must be a string')
        })
    })
    describe('resize()', function() {
        beforeEach(function() {
            mock({
                'path/to/fake/dir': {
                    'some-file.txt': 'file content here',
                    'empty-dir': {/** empty directory */
                    }
                },
                'path/to/some.png': Buffer.from([
                    8,
                    6,
                    7,
                    5,
                    3,
                    0,
                    9
                ]),
                'some/other/path': {/** another empty directory */
                }
            })
        })
        afterEach(function() {
            mock.restore()
        })
        it('returns an object', function() {
            let result = SUT.resize('./path/to/some.png', 'png', 200, 200)
            assert.typeOf(result, 'object')
        })
        it('contains the pipe method, becusae it is a stream', function() {
            let result = SUT.resize('./path/to/some.png', 'png', 200, 200)
            assert.typeOf(result.pipe, 'function')
        })
        it('returns a stream that contains the width/height input', function() {
            let result = SUT.resize('./path/to/some.png', 'png', 100, 300)
            expect(result.options.width).to.equal(100)
            expect(result.options.height).to.equal(300)
        })
        it('errors out when given an incorrect format', function() {
            expect(function() {
                let result = SUT.resize('./path/to/some.png', 'xhr', 200, 200)
            }).to.throw(TypeError, 'resize error: Invalid format. Must be jpg, jpeg, png, or gif.')
        })
        it('errors out width/height is not a number', function() {
            expect(function() {
                let result = SUT.resize('./path/to/some.png', 'png', 200, '200')
            }).to.throw(TypeError, 'resize error: Width or height must be of type number.')
        })

    })
    describe.only('showImages()', function() {
        let fakeReq
        beforeEach(function() {
            // set fake seessions
            fakeReq = mockRequest({
                session: {
                    user: 'test user'
                }
            })
        })
        afterEach(function() {
            Image.find.restore()
            // fakeRes.status.restore()
        })
        it('calls db.find() spy once', function() {
            sinon.spy(Image, 'find')
            // this syntax is same as (spy) find.restore - used as no need for scope
            let result = SUT.showImages(fakeReq, fakeRes)
            expect(Image.find.calledOnce).to.be.true
        })
        it('calls db.find() stub and resolves the promise', function() {
            // stub promise and change return
            let stub = sinon.stub(Image, 'find').resolves('Image goes here')
            SUT.showImages(fakeReq, fakeRes)
            sinon.assert.calledOnce(stub);
        })
        it('calls res.render() spy once', function() {
            let stub = sinon.stub(Image, 'find').resolves('Image goes here')
            let res = {
                render: sinon.spy()
            }
            let result = SUT.showImages(fakeReq, res)
            return result.then(i => {
                sinon.assert.calledOnce(res.render)
            })
        })
        it.only('returns a error when there are no sessions', function() {
            let noSession = {
                session: {}
            }
            let res = {
                // status returns send
                status: sinon.stub().returns({
                    send: sinon.spy()
                })
            }
            let stub = sinon.stub(Image, 'find').resolves('Image goes here')
            let result = SUT.showImages(noSession,res )
            sinon.assert.calledOnce(res.status)

        })

    })

})
