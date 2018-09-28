const mongoose = require('mongoose')
const Schema = mongoose.Schema
const assert = require('assert')


  const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
  });
const userModel = mongoose.model('User', userSchema)

module.exports = userModel

var user1 = new userModel();
user1.save(function(error) {
	assert.equal(error.errors['email'].message, 'Path `email` is required.');

	error = user1.validateSync();
	assert.equal(error.errors['email'].message, 'Path `email` is required.');
});

var user2 = new userModel({email: 'user1'});
user2.save(function(error) {
	assert.equal(error.errors['password'].message, 'Path `password` is required.');

	error = user2.validateSync();
	assert.equal(error.errors['password'].message, 'Path `password` is required.');
});
