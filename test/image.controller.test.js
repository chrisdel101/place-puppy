const SUT = require('../logic/controllers/images.controller')
// const x = require('../public/javascripts/validation')
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
let rewiredAdd = rewire('../logic/controllers/images.controller').add
const mongoose = require('mongoose')
const cloudinary = require('cloudinary')
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
        it('throws an error when a passed a URL without and extension', function() {
            expect(function() {
                SUT.replaceUrlExt('a', 'png')
            }).to.throw(TypeError, 'Url is not has not extension. Must be jpg, png, or gif.')
        })
        it('throws an error when given a new extentsion that is not valid', function() {
            expect(function() {
                SUT.replaceUrlExt('http://example.jpg', 'alt')
            }).to.throw(TypeError, 'Extension is not valid to replace url. Only png, jpg, and gif.')
        })
    })
    describe('addFile()', function() {
        it('returns an undefined', function() {
            // use mockRequest to set user session
            let req = mockRequest({
                session: {
                    user: 'test user'
                }
            })
            let result = SUT.addFile(req, fakeRes)
            // expect(result).to.equal(undefined)
        })
        it('will not run function without a user in the session', function() {
            let req = mockRequest({
                session: {
                    user: ''
                }
            })
            let console = {
                log: sinon.spy(),
                error: sinon.spy()
            }
            rwSUT.__set__('console', console)
            let result = rwSUT.addFile(req, fakeRes)
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
        it('throws an error when given an input that is not a string', function() {
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
        it('throws an error when given an incorrect format', function() {
            expect(function() {
                let result = SUT.resize('./path/to/some.png', 'xhr', 200, 200)
            }).to.throw(TypeError, 'resize error: Invalid format. Must be jpg, jpeg, png, or gif.')
        })
        it('throws an error when width/height is not a number', function() {
            expect(function() {
                let result = SUT.resize('./path/to/some.png', 'png', 200, '200')
            }).to.throw(TypeError, 'resize error: Width or height must be of type number.')
        })

    })
    describe('showImages()', function() {
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
        it('returns a error when there are no sessions', function() {
            let noSession = {
                session: {}
            }
            let res = {
                // status returns send
                status: sinon.stub().returns({send: sinon.spy()})
            }
            let stub = sinon.stub(Image, 'find').resolves('Image goes here')
            let result = SUT.showImages(noSession, res)
            sinon.assert.calledOnce(res.status)

        })

    })
    describe('setImageQuality()', function() {
        let str = "https://res.cloudinary.com/chris-del/image/upload/v1537584219/o0bfegw7lw6j89jhmi2g.jpg"
        it('returns a string', function() {
            let result = SUT.setImageQuality(str, 'high')
            assert.typeOf(result, 'string')
        })
        it('returns the string correctly with input params', function() {
            let result = SUT.setImageQuality(str, 'low')
            expect(result).to.equal('https://res.cloudinary.com/chris-del/image/upload/q_auto:low/v1537584219/o0bfegw7lw6j89jhmi2g.jpg')
        })
        it('throws an error when given input params that are not strings', function() {
            expect(function() {
                let result = SUT.setImageQuality(10, 'high')
            }).to.throw(TypeError, 'setImageQuality error: functions params must both be strings')
            expect(function() {
                let result = SUT.setImageQuality(str, ['high'])
            }).to.throw(TypeError, 'setImageQuality error: functions params must both be strings')
        })
        it('throws and error when given a quality setting that is not an option', function() {
            expect(function() {
                let result = SUT.setImageQuality(str, 'blah')
            }).to.throw(TypeError, 'setImageQuality: quality setting is invalid. Must be high, good, eco, or low')
        })
    })
    describe.only('add()', function() {
        // rewire add function
        let SUT = rewire('../logic/controllers/images.controller')
        let imageStub
        let cloudinaryStub
        let newFakeReq
        let image
        let data
        let fs
        beforeEach(function() {
            mock({
                'path/to/some.png': Buffer.from([
                    8,
                    6,
                    7,
                    5,
                    3,
                    0,
                    9
                ])
            })
            fakeRes.redirect = sinon.spy()
            // mock req with req params
            newFakeReq = mockRequest({
                file: {
                    name: 'image.png',
                    mimetype: 'image/png',
                    // send this to the mock fs above
                    path: './path/to/some.png',
                    originalName: 'fake original name'
                },
                flash: sinon.spy(),
                body: {
                    title: 'fake title',
                    photographer: 'fake photographer',
                    description: 'fake desc',
                    locationTaken: 'fake location',
                    alt: 'fake alt',
                    contentType: 'fake type',
                    'route-path': 'fake path'
                }
            })
            // create a fake image instance
            image = new Image({
                id: '1234',
                filename: 'fake original file name',
                title: 'fake title',
                photographer: 'fake photographer',
                description: 'fake desc',
                locationTaken: 'fake location',
                src: 'fake src',
                alt: 'fake alt',
                contentType: 'fake type',
                path: '../tmp'
            })
            data = {
                public_id: 'fake data id',
                secure_url: 'https://afakeurl.com'
            }
            // stub and rewire cloudinaryUploader
            cloudinaryStub = sinon.stub().resolves(data)
            SUT.__set__('cloudinaryUploader', cloudinaryStub);
            // stub the prototype to get to the .save() instance
            // https://stackoverflow.com/questions/28824519/stubbing-the-mongoose-save-method-on-a-model
            let saveData = {
                public_id: data.public_id,
                secure_url_: data.sercure_url
            }
            imageStub = sinon.stub(Image.prototype, 'save').resolves(saveData)
            fs = {
                unlink: sinon.spy(),
                readdirSync: sinon.spy()
            }
            SUT.__set__('fs', fs)
        })
        afterEach(function() {
            cloudinaryStub.resolves()
            Image.prototype.save.restore();
            mock.restore()
        })
        it('redirects and flashes when req does not contain a file object', function() {
            // set file to null
            newFakeReq.file = null
            SUT.add(newFakeReq, fakeRes)
            // flash once
            sinon.assert.calledOnce(newFakeReq.flash)
            sinon.assert.calledOnce(fakeRes.redirect)
        })
        it('redirects and flashes if attacment is not an image type', function() {
            newFakeReq.file.mimetype = 'blahblah'
            SUT.add(newFakeReq, fakeRes)
            sinon.assert.calledOnce(newFakeReq.flash)
            sinon.assert.calledOnce(fakeRes.redirect)
        })
        it('calls the cloudinaryUploaer', function() {
            SUT.add(newFakeReq, fakeRes)
            sinon.assert.calledOnce(cloudinaryStub)
        })
        // wrap in timer since .save() takes time to fire
        it('calls db.save()', function(done) {
            SUT.add(newFakeReq, fakeRes)
            setTimeout(function() {
                sinon.assert.calledOnce(imageStub)
                done();
            }, 0);
        })
        it('calls flash and redirect after saving', function(done) {
            SUT.add(newFakeReq, fakeRes)
            setTimeout(function() {
                sinon.assert.calledOnce(newFakeReq.flash)
                sinon.assert.calledOnce(fakeRes.redirect)
                done();
            }, 0);
        })
    })
})
// rwSUT.__set__('console', console)

// let stub = sinon.stub(Image, 'find').resolves('Image goes here')
// let req = mockRequest({
//     session: {
//         user: ''
//     }
// })
// let console = {
//     log: sinon.spy(),
//     error: sinon.spy()
// }
// rwSUT.__set__('console', console)
// let result = rwSUT.addFile(req, fakeRes)
// expect(console.error.callCount).to.equal(1)
//
// })
// })
