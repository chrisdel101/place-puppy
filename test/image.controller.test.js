const SUT = require('../logic/controllers/images.controller')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect

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
})
