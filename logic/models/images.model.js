const mongoose = require('mongoose')
const Schema = mongoose.Schema;

  const imageSchema = new mongoose.Schema({
    title: String,
    photographer:String,
    description: String,
    location_taken:String,
    tags:Array
  });
    const imageModel = mongoose.model('Image', imageSchema)

    module.exports = imageModel
