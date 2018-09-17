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
const cloudinary = require('cloudinary')
const https = require('https')
const Stream = require('stream').Transform

module.exports = {
    showImages: showImages,
    extractDims: extractDims,
    resize: resize,
    imageFormat: imageFormat,
    processImage: (req, res) => {
        var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
        // get pathname from url
        let pathName = url.parse(fullUrl)
        // regex checks to see if /
        let re = /^\//ig
        // get pathname from url
        pathName = pathName.pathname
        if (pathName.match(re)) {
            // slice out forward slash
            pathName = pathName.slice(1, pathName.length)
        }
        console.log('pathname', pathName)
        // url matches image from db - needs field
        let promise = Image.findOne({path: pathName}).exec()
        promise.then(img => {
            console.log(img)

            let format = module.exports.imageFormat(img.contentType)
            let dims = module.exports.extractDims(pathName)
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

            https.get(img.src, (response) => {
                var data = new Stream();
                // res.setEncoding('binary')
                response.on('data', (chunk) => {
                    // console.log('chunk', chunk)
                    data.push(chunk);

                })
                response.on('end', () => {
                    data = data.read()
                    let file = fs.writeFile('./tmp/logo.png', data, 'binary', (err) => {
                        if (err)
                            throw err
                        console.log('image created')

                        return new Promise(function(resolve, reject) {
                            fs.writeFile('./tmp/logo.png', data, 'binary', (err) =>  {
                                if (err)
                                    reject(err);
                                else
                                    resolve(data);
                                }
                            );
                        }).then(data => {
                            module.exports.resize('./tmp/logo.png', format, width, height).pipe(res)

                            fs.unlink('./tmp/logo.png');
                            console.log('unlinked')
                        }).catch(err => {
                            console.error("An error in a promise show image", err)
                            res.send('An Err', err)
                        })
                    });
                })

            })
        })
        //unless images are random
        //  console.log('fullUrl', fullUrl)
        // module.exports.outReq.push(req.path)
        // return '100x100'
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
    showImage: (req, res) => {
        module.exports.processImage(req, res)
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
        promise.then(data => {
            console.log('data', data)
            // make image with data from cloudinary
            let image = new Image({
                filename: file.originalname,
                title: req.body.title,
                photographer: req.body.photographer,
                description: req.body.description,
                locationTaken: req.body.locationTaken,
                src: data.secure_url,
                contentType: file.mimetype,
                path: req.body['route-path']
            })

            console.log('image : ' + image);
            // console.log('base64' + String(image.data).substring(0, 50));
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
        }).catch(err => {
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
            fieldFour: 'Path to match',
            fieldFive: 'Upload',
            fieldSix: 'Alt Tag',
            buttonField: 'Submit',
            field_one_for: 'title',
            field_two_for: 'photographer',
            field_three_for: 'description',
            field_four_for: 'path-match',
            field_five_for: 'upload',
            field_six_for: 'alt',
            field_one_id: 'title',
            field_two_id: 'photographer',
            field_three_id: 'description',
            field_four_id: 'path-match',
            field_five_id: 'upload',
            field_six_id: 'alt',
            field_one_placeholder: 'Title of work',
            field_two_placeholder: "Photographer's name",
            field_three_placeholder: 'Describe Image',
            field_four_placeholder: 'Route path image should match i.e 100x100',
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
            field_four_name: 'route-path',
            field_five_name: 'file',
            field_six_name: 'alt',
            routeName: req.path

        })
    }
}

function extractDims(urlDims) {
    let pageUrl = urlDims
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
}

function showImages(req, res) {
    // if (!req.session.user) {
    //     return res.status(401).send()
    // }
    cloudinary.v2.search.expression("resource_type:image").execute(function(error, result) {
        console.log('result', result)
        // res.send(result)
        res.render('images', {imagesArr: result.resources})
    });
}

function resize(path, format, width, height) {
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

}
function imageFormat(input) {
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
}
