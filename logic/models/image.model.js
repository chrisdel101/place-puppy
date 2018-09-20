const mongoose = require('mongoose')
const Schema = mongoose.Schema
const assert = require('assert')

const imageSchema = new mongoose.Schema({
    id: String,
	filename: String,
	title: {
		type: String,
		required: true
	},
	photographer: String,
	description: String,
	tags: [String],
	src: {
		type: String,
		required: true
	},
	contentType: String,
    path: {
        type: String,
        unique: true
    },
    alt: String,
    created: {
        type: Date,
        default: Date.now()
    }
});
const imageModel = mongoose.model('Image', imageSchema)

module.exports = imageModel

var image = new imageModel();
image.save(function(error) {
	assert.equal(error.errors['title'].message, 'Path `title` is required.');

	error = image.validateSync();
	assert.equal(error.errors['title'].message, 'Path `title` is required.');
});

var image2 = new imageModel({title: 'hello'});
image2.save(function(error) {
	assert.equal(error.errors['src'].message, 'Path `src` is required.');

	error = image2.validateSync();
	assert.equal(error.errors['src'].message, 'Path `src` is required.');
});
