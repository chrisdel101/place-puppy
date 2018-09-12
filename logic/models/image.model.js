const mongoose = require('mongoose')
const Schema = mongoose.Schema;

  const imageSchema = new mongoose.Schema({
    filename: String,
    title: String,
    photographer:String,
    description: String,
    locationTaken:String,
    tags:Array,
    data: Buffer,
    contentType: String
  });
    const imageModel = mongoose.model('Image', imageSchema)

    module.exports = imageModel
