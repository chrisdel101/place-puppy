// const Image = require('../models/images.model.js')
const url = require('url')
// var multer  = require('multer')
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, '/uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now() + file.originalname)
//   }
// })
// var upload = multer({ storage: storage})
const sharp = require('sharp')
const fs = require('fs')
// console.log(sharp.format);

// /Users/chrisdielschnieder/desktop/code_work/cs50/pset9/placepuppy/public/images/Dog_Pic.JPG
// var image = fs.readFile('/Users/chrisdielschnieder/desktop/code_work/cs50/pset9/placepuppy/public/images/Dog_Pic.JPG', function(err, data) {
//     fs.writeFile('outputImage.jpg', data, 'binary', function (err) {
//         if (err) {
//             console.log("There was an error writing the image")
//         }
//
//         else {
//             console.log("There file was written")
//         }
//     });
// });

// console.log(image)


// console.log(Image)
module.exports = {
    showImages: (req, res) => {
        // show all images
        Image.find(function(err, image) {
            if (err) return console.log(err)
            res.send(image)
        })
    },
    extractDims: function(inputUrl){
        let pageUrl = inputUrl
        let newUrl = url.parse(pageUrl)
        // all nums before x
        var re = /\d+(?=\x)/g
        // look behind doesn't work
        // var behind = /(?<=\x)\d+/g

        // get first num
        var width = newUrl.pathname.match(re).join('')
        // reverse String
        var reverseUrl = Array.from(newUrl.pathname).reverse().join('')
        // extract digits -
        var height = reverseUrl.match(re).join('')
        // un-reverse back to normal
        height = Array.from(height).reverse().join('')
        // var height = newStr.match(re)
        // second = Array.from(second).reverse().join('')
        return {
            width:width,
            height:height
        }
    },
    resize: (path, format, width, height) => {
        const readStream = fs.createReadStream(path)
        let transform = sharp();

        if (format) {
            transform = transform.toFormat(format);
        }

        if (width || height) {
            transform = transform.resize(width, height)
            // console.log(transform)
        }

        return readStream.pipe(transform);

    },
    imageFormat: (input) => {

        // convert to lower
        if(typeof input === 'string'){
            input = input.toLowerCase()
        }

        if(input.includes('jpeg') || input.includes('jpg')){
            return 'jpg'
        } else if(input.includes('png')){
            return 'png'
        } else {
            return 'jpg'
        }
    },
    showImage: (req,res) => {
        console.log(req.path)
        var fullUrl = `${req.protocol}://${req.get('host')}${ req.originalUrl}`
        // // console.log('fullUrl', fullUrl)
        let format = module.exports.imageFormat(fullUrl)
        let dims = module.exports.extractDims(req.path)
        // var image = "IMG_8010--2--NS.jpg"
//
        let width = parseInt(dims.width)
        let height = parseInt(dims.height)
        if (!width || ! height) {
            console.log('width or height is null')
            return
        }
        let src =  `${__dirname}/JPEG_example_JPG_RIP_100.jpeg`

            res.type(`image/${format || 'jpg'}`);
            // console.log(format)
            // console.log(width)
            // console.log(height)
            module.exports.resize(src,'jpg', width, height)
            .pipe(res)
        // module.exports.outReq.push(req.path)
        return '100x100'
        // console.log('outreq', outReq.path)
            // sharp(image)
            //     .resize(200, 200)
            //     .toFile('output.jpg', (err, done) => {
            //         console.log(done)
            //     })

            // sharp("JPEG_example_JPG_RIP_100.jepg")
            //   // .rotate()
            //   .resize(200)
            //   .toFile('hello.png')
            //   .then(data => console.log(data))
            //   .catch(err => console.error(err))

    },
    outReq: [],
    // uploadFile: (req,res) => {
    //     console.log('req body', req.body)
    //     let file = req.body.file
    //
    //     let image = new Image({
    //         title:req.body.title,
    //         photographer:req.body.photographer,
    //         description:req.body.description,
    //         location_taken:req.body.location_taken,
    //         file: file
    //
    //     })
    //     console.log('image', image)
    //     image.save(function(err, f){
    //         if(err) return console.error(err)
    //         if(image.save){
    //             console.log('saved')
    //         } else {
    //             console.log('not saved')
    //         }
    //     })
    //     req.flash('info', 'Image Saved');
    //     res.render('add')
    // },
    // // show view
    // addFile: (req,res) => {
    //     var dog = {
    //         color:'white',
    //         fluffy: true
    //     }
    //     let myImage = new Image({
    //         photographer: 'no photographer',
    //         title: 'no title',
    //         location_taken: 'no location_taken',
    //         tags:[]
    //     })
    //     // console.log(res)
    //     // myImage.save(function(err, image){
    //     //     if(err) return console.error(err)
    //     //     console.log('saved')
    //     // })
    //     res.render('add', {
    //         title: 'title',
    //         title_of_work:'Title of work',
    //         photographer: 'photographer',
    //         photographers_name: "Photographer's name",
    //         image_description: 'description',
    //         describe_image: 'Describe Image',
    //         location_taken:'location_taken',
    //         place_taken:'Place where image taken'
    //
    //     })
    // }
}
