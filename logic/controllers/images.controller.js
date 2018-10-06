const path = require('path')
const mongoose = require('mongoose')
const Image = mongoose.models.Image || require('../models/image.model.js')

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
const {cloudinaryUploader, extractDims} = require('../utils')
const https = require('https')
const streamTransform = require('stream').Transform
const Stream = require('stream')
const debug = require('debug')
const log = debug('image:log')
const error = debug('image:error')

module.exports = {
    showImages: showImages,
    // resize: resize,
    imageFormat: imageFormat,
    showImage: showImage,
    add: add,
    addFile: addFile,
    setImageQuality: setImageQuality,
    replaceUrlExt: replaceUrlExt
}
// module.exports.add = add
function add(req, res) {
    // console.log('req', req)
    // get file
    let file = req.file
    // console.log(req.file.path)
    // if no file, kill
    if (!file) {
        req.flash('info', 'No file attached')
        res.redirect('add')
        return
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
    let promise = cloudinaryUploader(file.path)
    promise.then(data => {
        // console.log('data', data)
        // make image with data from cloudinary
        let image = new Image({
            id: data.public_id,
            filename: file.originalname,
            title: req.body.title,
            photographer: req.body.photographer,
            description: req.body.description,
            locationTaken: req.body.locationTaken,
            src: data.secure_url,
            alt: req.body.alt,
            contentType: file.mimetype,
            path: req.body['route-path']
        })

        fs.unlink(file.path, function(err) {
            if (err) {
                console.error('Unlink error', err)
            }
            console.log('unlinked')
        });
        // save to DB
        try {
            let promise = image.save()
            promise.then(image => {
                console.log('SAVED', image)
                req.flash('success', 'Image Saved')
                res.redirect('add')
                return 'saved'
            }).catch(e => {
                console.log(`image not saved, ${e}`)
                req.flash('error', `Image not Saved: ${e}`);
                res.redirect('add')
            })
        } catch (e) {
            console.log(e)
        }
    }).catch(err => {
        console.error('An error occured', err)
        res.redirect('add')
    })
}
let imgs = []
// checks if called route is in queue T or F
function getCache(arr, pathname) {
    // make arr of only keys
    let paths = arr.map(key => {
        return Object.keys(key)[0]
    })
    return paths.includes(pathname)
}
// take image buff and push to arr
function manageImageCache(pathname, buffer) {
    let imgObj = {}
    imgObj[pathname] = buffer
    imgs.push(imgObj)
    // if more than 4, shift one off
    if (imgs.length > 4) {
        imgs.shift()
    }
}
function retreiveBufferIndex(pathname, arr) {
    for (let i = 0; i < arr.length; i++) {
        // console.log('KEYS', Object.keys(arr[i])[0])
        // console.log('path', pathname)
        if (Object.keys(arr[i])[0] === pathname)
            return arr.indexOf(arr[i])
    }
    return -1
}
function showImage(req, res, quality, format) {
    try {
        var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
        // get pathname from url
        let pathName = url.parse(fullUrl)
        // regex checks to see if starts w /
        let re = /^\//ig
        // get pathname from url
        pathName = pathName.pathname
        if (pathName.match(re)) {
            // slice out forward slash
            pathName = pathName.slice(1, pathName.length)
        }
        console.log('pathname', pathName)

        let dims = extractDims(pathName)
        //
        let width = parseInt(dims.width)
        let height = parseInt(dims.height)
        if (!width || !height) {
            console.log('width or height is null')
            throw TypeError('Width or height is null in showImage()')
        }
        // if in cache call from cache
        if (getCache(imgs, pathName)) {
            let index = retreiveBufferIndex(pathName, imgs)
            if(index < 0){
                throw TypeError('Error: Indexing of cache is less than zero. Illegal index.')
                return
            }
            let buffer = imgs[index][pathName]
            // Initiate the source
            var bufferStream = new Stream.PassThrough();
            // Write your buffer
            bufferStream.end(new Buffer(buffer));
            console.log('Serving from : cache')
            return resize(bufferStream, width, height, format).pipe(res)
        }

        let preSets = [
            '100x100',
            '150x150',
            '200x200',
            '250x250',
            '300x300',
            '350x350',
            '400x400',
            '450x450',
            '500x500',
            '550x550',
            '600x600',
            '650x650',
            '700x700'
        ]

        let promise = new Promise((resolve, reject) => {
            // if one of the preset images, send this
            if (preSets.includes(pathName)) {
                resolve(Image.findOne({path: pathName}).exec())
            } else {
                // else random
                // https://stackoverflow.com/questions/39277670/how-to-find-random-record-in-mongoose
                // Get the count of all users
                Image.count().exec(function(err, count) {
                    if (err)
                        console.error(err)
                        // Get a random entry
                    var random = Math.floor(Math.random() * count)
                    resolve(Image.findOne().skip(random).exec())
                })
            }

        })

        promise.then(img => {
            // check not null
            if (!img) {
                console.log('This data does not exist')
                res.send('Error. This data does not exist')
                return
            }
            console.log('img', img)

            let format = imageFormat(img.contentType)
            if (!format) {
                throw TypeError('Invalid format. Must be jpg, jpeg, png, or gif.')
            }

            // if format change in query, change img type
            if (format) {
                let newSrc = replaceUrlExt(img.src, format)
                img.src = newSrc
                console.log('Format src', img.src)

            }
            // get qualiy and set new str
            if (quality) {
                let newSrc = setImageQuality(img.src, quality)
                img.src = newSrc
                console.log('Quality src', img.src)
            }
            // set type
            res.type(`image/${format || 'jpg'}`);
            // call url from cloudinary
            https.get(img.src, (response) => {
                // check server okay
                if (response.statusCode === 200) {
                    console.log('status of url call', response.statusCode)
                    // make data stream
                    var data = new streamTransform();
                    response.on('data', (chunk) => {
                        data.push(chunk);
                    })
                    response.on('end', () => {
                        // read data with.read()
                        data = data.read()
                        // push to cache
                        https : //stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
                        // Initiate the source
                        var bufferStream = new Stream.PassThrough();
                        // Write your buffer
                        bufferStream.end(new Buffer(data));

                        manageImageCache(pathName, data)
                        console.log('serving from: cloud')
                        // pass to resize func and pipe to res
                        resize(bufferStream, width, height, format).pipe(res)
                    })
                } else {
                    console.error(`An http error occured`, response.statusCode)
                }
            })
        }).catch(err => {
            console.error("An error in the promise ending show", err)
            res.status(404).send(err)
        })
    } catch (err) {
        console.error('A try/catch error occured', err)
    }
}
function resize(stream, width, height, format) {
    if (typeof width !== 'number' || typeof height !== 'number') {
        throw TypeError('resize error: Width or height must be of type number.')
    }
    var transformer = sharp().resize(width, height).on('info', function(info) {
        console.log('Inside resize: resize okay');
    });
    return stream.pipe(transformer)
}
function setImageQuality(urlStr, quality) {
    if (typeof urlStr !== 'string' || typeof quality !== 'string') {
        throw TypeError('setImageQuality error: functions params must both be strings')
    }
    if (quality !== 'high' && quality !== 'good' && quality !== 'eco' && quality !== 'low') {
        throw TypeError('setImageQuality: quality setting is invalid. Must be high, good, eco, or low')
    }
    // this should take 'upload'
    let beforeRegex = /(.+)upload/
    // pin on quality to start of string
    let afterRegex = /upload(.+)/

    let before = urlStr.match(beforeRegex)[0]
    let after = urlStr.match(afterRegex)[1]

    let insertStr = ``
    switch (quality) {
        case 'high':
            insertStr = `q_auto:best`
            break
        case 'good':
            insertStr = `q_auto:good`
            break
        case 'eco':
            insertStr = `q_auto:eco`
            break
        case 'low':
            insertStr = `q_auto:low`
            break
        default:
            insertStr = 'q_auto'
    }
    return `${before}/${insertStr}${after}`
}
function showImages(req, res) {
    // LOGIN REQUIRED
    if (req.session.user === undefined) {
        return res.status(401).send('401')
    }
    let promise = Image.find({})
    // console.log(promise)
    return promise.then(imgs => {
        // console.log(`imgs`, imgs)
        // res.send(imgs)
        res.render('images', {imgs: imgs})
    }).catch(err => {
        console.error(`An err occured: ${err}`)
    })
}

function imageFormat(imgSrc) {
    // convert to lower
    if (typeof imgSrc === 'string') {
        imgSrc = imgSrc.toLowerCase()
    } else {
        throw TypeError('imageFormat error: imgSrc must be a string')
    }

    if (imgSrc.includes('jpeg') || imgSrc.includes('jpg')) {
        return 'jpg'
    } else if (imgSrc.includes('png')) {
        return 'png'
    } else if (imgSrc.includes('gif')) {
        return 'gif'
    } else {
        return 'jpg'
    }
}
function addFile(req, res) {
    // no access without login
    if (!req.session.user) {
        console.error('Not signed in')
        return res.status(401).send()
    }
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
function replaceUrlExt(imgUrl, newExt) {
    if (newExt !== 'jpg' && newExt !== 'png' && newExt !== 'gif' && newExt !== 'jpeg') {
        throw new TypeError('Extension is not valid to replace url. Only png, jpg, and gif.')
    }
    if (!imgUrl.includes('jpg') && !imgUrl.includes('png') && !imgUrl.includes('gif') && !imgUrl.includes('jpeg')) {
        throw TypeError("Url is not has not extension. Must be jpg, png, or gif.")
    }
    let fileNoExt = imgUrl.split('.').slice(0, -1).join('.')
    return `${fileNoExt}.${newExt}`
}
