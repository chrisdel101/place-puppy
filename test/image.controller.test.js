const SUT = require('../logic/controllers/images.controller')
const x = require('../public/javascripts/validation')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
const mock = require('mock-fs')
const fs = require('fs')
describe('images controller', function() {
    describe('extractDims()', function() {
        it('returns an object', function() {
            let result = SUT.extractDims('/400x400')
            assert.typeOf(result, 'object')
        })
        it('returns values equal to input vals', function() {
            let result = SUT.extractDims('/400x400')
            let input1 = '400'
            let input2 = '400'
            expect(result.width).to.equal(input1)
            expect(result.height).to.equal(input2)
        })
        it('errors out when given a number', function() {
            expect(function() {
                SUT.extractDims(400)
            }).to.throw(TypeError, 'Incorrect input: Needs to be a string')
        })
    })
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

        // it('a', function() {
        //     expect(SUT.replaceUrlExt('a', '1')).to.throw(TypeError, "Extension is not valid to replace url. Only png, jpg, and gif.")
        // })
    })
    describe('filterImages()', function() {
        describe('returns an array', function() {
            // mock({
            //     'path/to/fake/dir': {
            //         'some-file.txt': 'file content here',
            //         'empty-dir': {/** empty directory */
            //         }
            //     },
            //     'path/to/some.png': Buffer.from([
            //         8,
            //         6,
            //         7,
            //         5,
            //         3,
            //         0,
            //         9
            //     ]),
            //     'some/other/path': {/** another empty directory */
            //     }
            // });
            // placepuppy/public/public-images
            let result = SUT.filterImages(['a'], './public')
        })
    })
})
