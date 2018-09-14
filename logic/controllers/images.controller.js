const Image = require('../models/image.model.js')
const url = require('url')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, '/uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + file.originalname)
    }
})
const upload = multer({storage: storage})
const sharp = require('sharp')
const fs = require('fs')
const session = require('express-session')
const cloudinary = require('cloudinary');

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
        if (!req.session.user) {
            return res.status(401).send()
        }
        let arr
        // show all images
        Image.find(function(err, images) {
            if (err)
                return console.log(err)
            console.log('image', images)
            // make arr of strings
            let arr = images.map(image => image.data)
            // pass arr to template
            res.render('images', {imagesArr: arr})
        })
    },
    extractDims: function(inputUrl) {
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
        return {width: width, height: height}
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
        if (typeof input === 'string') {
            input = input.toLowerCase()
        }

        if (input.includes('jpeg') || input.includes('jpg')) {
            return 'jpg'
        } else if (input.includes('png')) {
            return 'png'
        } else {
            return 'jpg'
        }
    },
    showImage: (req, res) => {
        console.log(req.path)
        var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
        //  console.log('fullUrl', fullUrl)
        let format = module.exports.imageFormat(fullUrl)
        let dims = module.exports.extractDims(req.path)
        // var image = "IMG_8010--2--NS.jpg"
        //
        let width = parseInt(dims.width)
        let height = parseInt(dims.height)
        if (!width || !height) {
            console.log('width or height is null')
            return
        }
        let src = `${__dirname}/JPEG_example_JPG_RIP_100.jpeg`

        res.type(`image/${format || 'jpg'}`);
        // console.log(format)
        // console.log(width)
        // console.log(height)
        module.exports.resize(src, 'jpg', width, height).pipe(res)
        // module.exports.outReq.push(req.path)
        return '100x100'
        // console.log('outreq', outReq.path)
        // sharp(image)
        //     .resize(200, 200)
        //     .toFile('output.jpg', (err, done) => {
        //         console.log(done)
        //     })

        // sharp("JPEG_example_JPG_RIP_100.jepg")
        //    .rotate()
        //   .resize(200)
        //   .toFile('hello.png')
        //   .then(data => console.log(data))
        //   .catch(err => console.error(err))

    },
    add: (req, res) => {
        // get file
        let file = req.file
        console.log(req.file.path)
        // if no file, kill
        if (!file) {
            req.flash('info', 'No file attached')
            res.redirect('add')
        }
        console.log('file', file)
        // if not image, kill
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
            console.log('File type is not an image')
            req.flash('info', 'File is not a image. Upload images only')
            res.redirect('add')
            return
        }
        // put image into cloudinary
        let promise = module.exports.cloudinaryUploader(file.path)
        promise
        .then(data => {
            console.log('data', data)
            // make image with data from cloudinary
            let image = new Image({
                filename: file.originalname,
                title: req.body.title,
                photographer: req.body.photographer,
                description: req.body.description,
                locationTaken: req.body.locationTaken,
                imageUrl: data.url,
                contentType: file.mimetype

            })

            console.log('image : ' + image);
            console.log('base64' + String(image.data).substring(0, 50));
            // unlink form /uploads
            fs.unlink(file.path);
            // save to DB
            let promise = image.save()

            promise.then(image => {
                console.log('saved')
                req.flash('success', 'Image Saved')
                res.redirect('add')
            }).catch(e => {
                console.log(`image not saved, ${e}`)
                req.flash('error', `Image not Saved: ${e}`);
                res.redirect('add')
            })
        })
        .catch(err => {
            console.error('An error occured', err)
            res.redirect('add')
        })
    },
    cloudinaryUploader: (image) => {
        return new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(image, (error, result) => {
                if (error) {
                    console.error(error)
                    reject(error)
                } else {
                    console.log('result', result)
                    resolve(result)
                }
            })

        })
    },
    // show view
    addFile: (req, res) => {
        // console.log('session user', req.session.user)
        // if(!req.session.user){
        //     return res.status(401).send()
        // }
        // var dog = {
        //     color:'white',
        //     fluffy: true
        // }
        // let myImage = new Image({
        //     photographer: 'no photographer',
        //     title: 'no title',
        //     locationTaken: 'no location_taken',
        //     tags:[]
        // })
        // console.log(res)
        // myImage.save(function(err, image){
        //     if(err) return console.error(err)
        //     console.log('saved')
        // })
        return res.render('add', {
            method: 'POST',
            action: '/add',
            enctype: 'multipart/form-data',
            fieldOne: 'Title',
            fieldTwo: 'Photographer',
            fieldThree: 'Description',
            fieldFour: 'Image Location',
            fieldFive: 'Upload',
            fieldSix: 'Alt Tag',
            buttonField: 'Submit',
            field_one_for: 'title',
            field_two_for: 'photographer',
            field_three_for: 'description',
            field_four_for: 'location-taken',
            field_five_for: 'upload',
            field_six_for: 'alt',
            field_one_id: 'title',
            field_two_id: 'photographer',
            field_three_id: 'description',
            field_four_id: 'location-taken',
            field_five_id: 'upload',
            field_six_id: 'alt',
            field_one_placeholder: 'Title of work',
            field_two_placeholder: "Photographer's name",
            field_three_placeholder: 'Describe Image',
            field_four_placeholder: 'Place where image taken',
            field_five_placeholder: 'Upload',
            field_six_placeholder: 'Add alt tag',
            field_one_type: 'text',
            field_two_type: 'text',
            field_three_type: 'text',
            field_four_type: 'text',
            field_five_type: 'file',
            field_six_type: 'text',
            field_one_name: 'title',
            field_two_name: 'photographer',
            field_three_name: 'description',
            field_four_name: 'locationTaken',
            field_five_name: 'file',
            field_six_name: 'alt',
            routeName: req.path

        })
    }
}
