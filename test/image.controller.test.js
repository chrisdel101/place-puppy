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

const mongoose = require('mongoose')
const cloudinary = require('cloudinary')
const Image = mongoose.models.Image || require('../models/image.model.js')
const nock = require('nock')
const Stream = require('stream')
const https = require('https')
// create a fake image instance
let fakeImage = image = new Image({
    id: '1234',
    filename: 'fake original file name',
    title: 'fake title',
    photographer: 'fake photographer',
    description: 'fake desc',
    locationTaken: 'fake location',
    src: 'https://fake-src.png',
    alt: 'fake alt',
    contentType: 'png',
    path: '../tmp'
})

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
            // mock error
            let error = sinon.spy()
            // inject error
            rwSUT.__set__('error', error)
            let result = rwSUT.addFile(req, fakeRes)
            expect(error.callCount).to.equal(1)
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
        let stream = new Stream.PassThrough()
        afterEach(function() {
            mock.restore()
        })
        it('returns an object', function() {
            let result = SUT.resize(stream, 200, 200, 'png')
            assert.typeOf(result, 'object')
        })
        it('throws an error when given an incorrect format', function() {
            expect(function() {
                let result = SUT.resize('./path/to/some.png', 200, 200, 'xhr')
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
    describe('add()', function() {
        // rewire add function
        let SUT = rewire('../logic/controllers/images.controller')
        let imageStub
        let cloudinaryStub
        let fakeReq
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
            fakeReq = mockRequest({
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
            fakeReq.file = null
            SUT.add(fakeReq, fakeRes)
            // flash once
            sinon.assert.calledOnce(fakeReq.flash)
            sinon.assert.calledOnce(fakeRes.redirect)
        })
        it('redirects and flashes if attacment is not an image type', function() {
            fakeReq.file.mimetype = 'blahblah'
            SUT.add(fakeReq, fakeRes)
            sinon.assert.calledOnce(fakeReq.flash)
            sinon.assert.calledOnce(fakeRes.redirect)
        })
        it('calls the cloudinaryUploaer', function() {
            SUT.add(fakeReq, fakeRes)
            sinon.assert.calledOnce(cloudinaryStub)
        })
        // wrap in timer since .save() takes time to fire
        it('calls db.save()', function(done) {
            SUT.add(fakeReq, fakeRes)
            setTimeout(function() {
                sinon.assert.calledOnce(imageStub)
                done();
            }, 0);
        })
        // timer needed for these two
        it('calls flash and redirect after saving', function(done) {
            SUT.add(fakeReq, fakeRes)
            setTimeout(function() {
                sinon.assert.calledOnce(fakeReq.flash)
                sinon.assert.calledOnce(fakeRes.redirect)
                done();
            }, 0);
        })
    })
    describe('showImage()', function() {
        let fakeReq
        let fakeRes
        let findOneResult
        let fakeCountResult
        let httpCall
        let resize
        beforeEach(function() {
            fakeReq = mockRequest({
                protocol: 'https',
                get: function() {
                    return 'localhost:3000'
                },
                originalUrl: '/100x100'

            })
            fakeRes = mockResponse({type: sinon.stub().returns('image/png')})
            findOneResult = {
                exec: sinon.stub().resolves(fakeImage)
            }
            // stub Image find
            imageFind = sinon.stub(Image, 'findOne')
            imageFind.returns(findOneResult)
            // stub Image Count and exec
            fakeCountResult = {
                exec: sinon.stub().resolves(1000)
            }
            let imageCount = sinon.stub(Image, 'count').returns(fakeCountResult)
            // httpCall returns a stream
            let mockStream = new Stream.Transform()
            // resize returns a object with a pipe func
            let resizeRes = {
                pipe: sinon.spy()
            }
            httpCall = sinon.stub().resolves(mockStream)
            resize = sinon.stub().returns(resizeRes)
            rwSUT.__set__('httpCall', httpCall)
            rwSUT.__set__('resize', resize)
            nock('https://fake-src.png').get('/').reply(200)
        })
        afterEach(function() {
            Image.findOne.restore()
            Image.count.restore()


        })
        it('calls findOne() when passed a preset set of dims 100x100', function() {
            let result = rwSUT.showImage(fakeReq, fakeRes, '', '')
            sinon.assert.calledOnce(Image.findOne)
        })
        it('calls Count() when passed dims not in the presets', function() {
            fakeReq = mockRequest({
                protocol: 'https',
                get: function() {
                    return 'localhost:3000'
                },
                originalUrl: '/100x151'

            })
            let result = rwSUT.showImage(fakeReq, fakeRes, '', '')
            sinon.assert.calledOnce(Image.count)
        })
        it.skip('calls resize', function() {
            let result = rwSUT.showImage(fakeReq, fakeRes, '', '')
            // httpCall.withArgs('https://fake-src.png', '2 2')
            sinon.assert.calledOnce(resize)

        })
        it('throws and error when given non-numeric dimension', function() {
            // fake req with letters in pathname
            fakeReq = mockRequest({
                protocol: 'https',
                get: function() {
                    return 'localhost:3000'
                },
                originalUrl: '/2r2x4fr'
            })
            expect(function() {
                let result = rwSUT.showImage(fakeReq, fakeRes, '', '')
            }).to.throw(Error, 'Non-numeric chars in the image dimensions')
        })
        it('returns image from the cache', function() {
            // CACHE STUBs
            fakeReq = mockRequest({
                protocol: 'https',
                get: function() {
                    return 'localhost:3000'
                },
                originalUrl: '/100x100'

            })
            // fake cache to send
            let cache = [
                {
                    "100x100": Buffer.from([1, 2, 3])
                }
            ]
            // stub actual clousureCache
            let cacheStub = sinon.stub().returns(cache)
            // stub get cache
            let getCache = sinon.stub().returns(true)
            // inject getCache
            rwSUT.__set__('getCache', getCache)
            // inject closureCache
            rwSUT.__set__('closureCache', cacheStub)
            // mock log
            let log = sinon.spy()
            // inject log
            rwSUT.__set__('log', log)
            after(function() {
                // getCache.restore()
            })
            let result = rwSUT.showImage(fakeReq, fakeRes, '', '')
            // check log is called
            assert(log.calledWith('Serving from : cache'))

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
        describe.skip('httpCall make mock server call', function() {
            nock('https://fake-src.png').get('/').reply(200, 'what what')
            it('mocks server', function() {
                let result = rwSUT.httpCall('https://fake-src.png', '100x100')
                return result.then(res => {
                    // check length of string passed into Nock
                    // expect(res._readableState.length).to.equal(9)
                })
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
    describe('closureCache()', function(){
        it('returns an array', function(){
            let result = SUT.closureCache('100x100', Buffer.from([8,6,7,5,3,0,9]), 'jpg')
            expect(Array.isArray(result)).to.be.true
        })
        it('creates an object with key:buffer format:string layout', function(){
            let result = SUT.closureCache('100x100', Buffer.from([8,6,7,5,3,0,9]), 'jpg')
            expect(result[0]).to.have.all.keys('100x100', 'format')
        })
        it('returns cache as getter func when no args given & holds cache', function(){
            let result = SUT.closureCache()
            expect(result.length).to.equal(2)
        })
    })
    describe('retreiveBufferIndex()', function(){
        let cache = [{'100x100':'My Buffer'}, {'300x300':'Another Buffer'}]
        it('returns an index - positive integer', function(){
            let result = SUT.retreiveBufferIndex('300x300', cache)
            expect(result).to.equal(1)
        })
        it('returns -1 when no index is found', function(){
            let result = SUT.retreiveBufferIndex('323x001', cache)
            expect(result).to.equal(-1)
        })
    })

})
