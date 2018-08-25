const Image = require('../models/images.model.js')
const db = process.env.DB_URI
// var formidable = require('formidable');
// const util = require('util');
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: '.public/uploads/' })

var app = express()



// console.log(Image)
module.exports = {
    uploadFile: (req,res) => {
        console.log('req body', req.body)
        let file = req.body.file

        let image = new Image({
            title:req.body.title,
            photographer:req.body.photographer,
            description:req.body.description,
            location_taken:req.body.location_taken,
            file: file

        })
        console.log('image', image)
        image.save(function(err, f){
            if(err) return console.error(err)
            if(image.save){
                console.log('saved')
            } else {
                console.log('not saved')
            }
        })
        req.flash('info', 'Image Saved');
        res.render('add')
    },
    // show view
    addFile: (req,res) => {
        var dog = {
            color:'white',
            fluffy: true
        }
        let myImage = new Image({
            photographer: 'no photographer',
            title: 'no title',
            location_taken: 'no location_taken',
            tags:[]
        })
        // console.log(res)
        // myImage.save(function(err, image){
        //     if(err) return console.error(err)
        //     console.log('saved')
        // })
        res.render('add', {
            title: 'title',
            title_of_work:'Title of work',
            photographer: 'photographer',
            photographers_name: "Photographer's name",
            image_description: 'description',
            describe_image: 'Describe Image',
            location_taken:'location_taken',
            place_taken:'Place where image taken'

        })
    }
}
