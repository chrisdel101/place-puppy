const SUT = require('../logic/utils')
const chai = require('chai')
const { assert } = chai
const { expect } = chai
const mock = require('mock-fs')
const sinon = require('sinon')
const rewire = require('rewire')
const rwSUT = rewire('../logic/utils')
const cloudinary = require('cloudinary')

describe('utils', function() {
    describe('filterImages()', function() {
        beforeEach(function() {
            // use mock data
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
        describe('returns an array', function() {
            // placepuppy/public/public-images
            it('returns an array', function() {
                let result = SUT.filterImages(['test'], './path/to/fake/dir')
                assert.typeOf(result, 'array')
            })
            it('returns the files that match the stubs in the array', function(){
                let result = SUT.filterImages(['txt'], './path/to/fake/dir')
                expect(result.includes('some-file.txt')).to.be.true
            })
        })
    })
    describe('extractDims()', function() {
        let log
        beforeEach(function(){
            // mock error
            log = sinon.spy()
            // inject error
            rwSUT.__set__('log', log)
        })
        it('returns an object', function() {
            let result = SUT.extractDims('/400x400')
            assert.typeOf(result, 'object')
        })
        it('returns values equal to input vals with valid string', function() {
            let result = SUT.extractDims('http://place-puppy.com/400x400')
            let input1 = '400'
            let input2 = '400'
            expect(result.width).to.equal(input1)
            expect(result.height).to.equal(input2)
        })
        it('follows valid url path with three logs', function(){
            // mock log
            let result = rwSUT.extractDims('http://place-puppy.com/400x400')
            expect(log.callCount).to.equal(3)

        })
        it('follows non-valid url path with two logs', function(){
            // mock log
            let result = rwSUT.extractDims('http:./400x400')
            expect(log.callCount).to.equal(2)

        })
        it('throws error when given valid string without dimensions', function(){
            expect(function() {
                SUT.extractDims("http://google.com")
            }).to.throw(TypeError, 'extractDims error: input url does not have dims to extract, or the dims are not in the right format. Must be in the pathname or url.')
        })
        it('throws error when given invalid string without dimensions', function(){
            expect(function() {
                SUT.extractDims("http://googl")
            }).to.throw(TypeError, 'extractDims error: input does not contain dims i.e. 100x100 neeeded for extract')
        })
        it('throws error when given a number', function() {
            expect(function() {
                SUT.extractDims(400)
            }).to.throw(TypeError, 'Incorrect input: Needs to be a string')
        })
    })
    describe.skip('cloudinaryUploaer()', function(){
        let stub
        beforeEach(function() {
            stub = sinon.stub(cloudinary.v2.uploader, 'upload').resolves('hello')
            // use mock data
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
            stub.restore()
        })
        it('returns a promise because it has a .then function', function(){
            console.log(stub.resolves('hello'))
            let result = SUT.cloudinaryUploader('./path/to/some.png')
            return result.then(res => console.log(res))
            assert.typeOf(result.then, 'function')
        })
        it('returns a promise because it has a .then function', function(){
            let result = SUT.cloudinaryUploader('./path/to/some.png')
            return result.then(res => {
                console.log(res)
            })
        })
    })
})
