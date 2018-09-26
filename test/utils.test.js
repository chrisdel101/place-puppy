const SUT = require('../logic/utils')
const chai = require('chai')
const { assert } = chai
const { expect } = chai
const mock = require('mock-fs')


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

})
