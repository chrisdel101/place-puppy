const mongoose = require('mongoose')
const Schema = mongoose.Schema
const assert = require('assert')

const imageSchema = new mongoose.Schema({
	filename: String,
	title: {
		type: String,
		required: true
	},
	photographer: String,
	description: String,
	locationTaken: String,
	tags: Array,
	data: {
		type: Buffer,
		required: true
	},
	contentType: String
});
const imageModel = mongoose.model('Image', imageSchema)

module.exports = imageModel

var image = new imageModel();
console.log(image)
image.save(function(error) {
	assert.equal(error.errors['title'].message, 'Path `title` is required.');

	error = image.validateSync();
	assert.equal(error.errors['title'].message, 'Path `title` is required.');
});

var image2 = new imageModel({title: 'hello'});
image2.save(function(error) {
	assert.equal(error.errors['data'].message, 'Path `data` is required.');

	error = image2.validateSync();
	assert.equal(error.errors['data'].message, 'Path `data` is required.');
});
