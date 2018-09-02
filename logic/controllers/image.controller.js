const Image = require('../models/images.model.js')
const url = require('url')
var multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
})
var upload = multer({ storage: storage})
const pica = require('pica')();

// var app = express()



// console.log(Image)
module.exports = {
    showImages: (req, res) => {
        // show all images
        Image.find(function(err, image) {
            if (err) return console.log(err)
            res.send(image)
        })
    },
    showImage: (req,res) => {
        let pageUrl = req.url
        let newUrl = url.parse(pageUrl)
        // all nums before x
        var ahead = /\d+(?=\x)/g
        // look behind doesn't work
        // var behind = /(?<=\x)\d+/g

        // get first num
        var first = newUrl.pathname.match(ahead)
        // reverse String
        var newStr = Array.from(newUrl).reverse().join('')
        console.log(newStr)
        var second = newStr.match(ahead)
        // second = Array.from(second).reverse().join('')
        // console.log(first)
        console.log(second)


        res.sendFile("/Users/chrisdielschnieder/desktop/code_work/cs50/pset9/placepuppy/public/images/Dog_Pic.JPG")
    },
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
