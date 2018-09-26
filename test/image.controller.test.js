const SUT = require('../logic/controllers/images.controller')
// const x = require('../public/javascripts/validation')
const chai = require('chai')
const {assert} = chai
const {expect} = chai
const mock = require('mock-fs')
// const fs = require('fs')
const {mockRequest, mockResponse} = require('mock-req-res')
const req = mockRequest()
const res = mockResponse()
const sinon = require('sinon')
const rewire = require('rewire')
const rwSUT = rewire('../logic/controllers/images.controller');

describe('images controller', function() {
    // describe('extractDims()', function() {
    //     it('returns an object', function() {
    //         let result = SUT.extractDims('/400x400')
    //         assert.typeOf(result, 'object')
    //     })
    //     it('returns values equal to input vals', function() {
    //         let result = SUT.extractDims('/400x400')
    //         let input1 = '400'
    //         let input2 = '400'
    //         expect(result.width).to.equal(input1)
    //         expect(result.height).to.equal(input2)
    //     })
    //     it('errors out when given a number', function() {
    //         expect(function() {
    //             SUT.extractDims(400)
    //         }).to.throw(TypeError, 'Incorrect input: Needs to be a string')
    //     })
    // })
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
            let req = mockRequest({
                session: {
                    user: 'test user'
                }
            })
            let result = SUT.addFile(req, res)
            expect(result).to.equal(undefined)
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
            // controller.__set('console', this.console)
            let result = rwSUT.addFile(req, res)
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
        it('returns a stream that contains the width/height input', function(){
            let result = SUT.resize('./path/to/some.png', 'png', 100 , 300)
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

})
