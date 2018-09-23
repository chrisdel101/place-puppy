// const Image = require('../models/image.model.js')
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
const https = require('https')
const Stream = require('stream').Transform

module.exports = {
    showImages: showImages,
    extractDims: extractDims,
    resize: resize,
    imageFormat: imageFormat,
    numFormat: numFormat,
    removeFwdSlash: removeFwdSlash,
    fullSeed: fullSeed,
    cloudinaryUploader: cloudinaryUploader,
    showImage: showImage,
    add: add,
    addFile: addFile,
    filterImages: filterImages,
    setImageQuality: setImageQuality
}

function add(req, res) {
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
    let promise = cloudinaryUploader(file.path)
    promise.then(data => {
        console.log('data', data)
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
}
function showImage(req, res, quality) {
    console.log('QUALTY', quality)
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
        // if one of the preset, send this
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

        let format = module.exports.imageFormat(img.contentType)
        format = 'png'
        let dims = module.exports.extractDims(pathName)
        //
        let width = parseInt(dims.width)
        let height = parseInt(dims.height)
        if (!width || !height) {
            console.log('width or height is null')
            return
        }

        // get qualiy and set new str
        if(quality){
            let newSrc = setImageQuality(img.src, quality)
            img.src = newSrc
        }

        console.log('NEW SRC', img.src)
        // let src = `${__dirname}/JPEG_example_JPG_RIP_100.jpeg`

        res.type(`image/${format || 'jpg'}`);
        // call url from cloudinary
        https.get(img.src, (response) => {
            console.log('make http call')
            if (response.statusCode === 200) {
                // console.log('res', response)
                console.log('status of url call', response.statusCode)
                var data = new Stream();
                response.on('data', (chunk) => {
                    // read chunks into stream
                    // console.log('res', response)
                    // console.log('data', chunk)
                    data.push(chunk);
                })
                response.on('end', () => {
                    console.log('in end')
                    // read data with.read()
                    data = data.read()
                    // make file and wrap in promise
                    fs.writeFile('./tmp/logo.jpg', data, 'binary', (err) => {
                        if (err)
                            throw err
                        console.log('tmp image stored')

                        return new Promise(function(resolve, reject) {
                            fs.writeFile('./tmp/logo.jpg', data, 'binary', (err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(data);
                                }
                            );
                            // resolve promise - resize and unlin
                        }).then(data => {

                            module.exports.resize('./tmp/logo.jpg', format, width, height).pipe(res)
                            // unlin from file
                            fs.unlink('./tmp/logo.jpg');
                            console.log('unlinked')
                        }).catch(err => {
                            console.error("An error in a promise show image", err)
                            res.send('An Err', err)
                        })
                    });
                })
            } else {
                console.error(`An http error occured`, response.statusCode)
            }
        })
    }).catch(err => {
        console.error("An error in the promise ending show", err)
        res.status(404).send(err)
    })
}
function removeFwdSlash(req) {
    var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    // get pathname from url
    let pathName = url.parse(fullUrl)
    // starts with /
    let re = /^\//ig
    // get pathname from url
    pathName = pathName.pathname
    if (pathName.match(re)) {
        // slice out forward slash
        pathName = pathName.slice(1, pathName.length)
        return pathName
    }
    return false
}
function numFormat(numStr) {
    console.log('numstr', numStr)
    // all nums before x
    var re1 = /\d+(?=\x)/g
    var beforeX = numStr.match(re1)
    if (!beforeX) {
        return false
    }
    // get x only if followed by num
    var re2 = /x(?=[0-9])/
    var afterX = numStr.match(re2)
    if (!afterX) {
        return false
    }
    return true
}
function extractDims(urlDims) {
    if(typeof urlDims !== 'string'){
        let error = new TypeError('Incorrect input: Needs to be a string')
        throw error
    }
    let pageUrl = urlDims
    let newUrl = url.parse(pageUrl)
    // all nums before x
    var re = /\d+(?=\x)/g
    //  get x only if followed by num
    // var secondNumRe = /x(?=[0-9])/

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
    function setImageQuality(urlStr, quality) {
    // this should take upload
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
function fullSeed(req, res) {
    // console.log('image id', publicImageId)
    // if global var is set, delete
    // if (publicImageId) {
    //     cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
    //         console.log('deleted')
    //          res.send(result)
    //     })
    // }

    // let files = fs.readdirSync("./public/public-images/seeds-copy")

    let files = filterImages([
        'jpg', 'png'
    ], "./public/public-images/seeds-copy")

    _addToDb(_createPromises(files, "./public/public-images/seeds-copy"), req, res)
    // let promises = files.map((file) => {
    //     console.log('file', file)
    //      let file = `adorable-animal-canine-163685.jpg`
    //     let src = `./public/public-images/for-seeds/${file}`
    //      add new image
    //     let promise = cloudinaryUploader(src)
    //      promise returned from cloudinary
    //     console.log('promise', promise)
    // promise.then(img => {
    //     console.log('img', img)
    //     publicImageId = img.public_id
    //      add bucket src to Image
    //     let image = new Image({
    //         filename: file,
    //         title: 'puppy image',
    //         photographer: 'NA',
    //         description: 'A seeded puppy',
    //         src: img.secure_url,
    //         contentType: img.format,
    //         path: '400x400'
    //     })
    //      remove all dogs everytime
    //     Image.remove({}, () => {
    //         let promise = image.save()
    //
    //         promise.then(image => {
    //             console.log('saved')
    //              req.flash('success', 'Image Saved')
    //              res.send('saved')
    //         }).catch(e => {
    //             console.log(`image not saved, ${e}`)
    //             req.flash('error', `Image not Saved: ${e}`);
    //             res.redirect('single-seed')
    //         })
    //     })
    // }).catch(err => {
    //     console.error('An error occured', err)
    //     res.send('An error at the end of the promise')
    // })

    // })
    // let allPromises = Promise.all(promises)
    // allPromises.then((results) => {
    //     console.log('all Promises', results)
    // })

}
function cloudinaryUploader(image) {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(image, {
            timeout: 10000000
        }, (error, result) => {
            if (error) {
                console.error('Error in the cloudinary loader', error)
                reject(error)
            } else {
                console.log('result', result)
                resolve(result)
            }
        })

    })
}
// makes array of promises with image files to upload
function _createPromises(files, dir) {
    let arr = []
    files.forEach((file) => {
        console.log('file', file)
        // let file = `adorable-animal-canine-163685.jpg`
        let src = `${dir}/${file}`
        // add new image\\
        let promise = cloudinaryUploader(src)
        // console.log('push in cloudinaryUploader')
        arr.push(promise)
        // console.log(promise)
    })
    return arr
}
function _addToDb(promiseArr, req, res) {
    // create array of promises
    let imgPromises = []
    promiseArr.forEach((promise, i) => {
        counter = 1
        imgPromises.push(new Promise((resolve, reject) => {
            promise.then(img => {
                // console.log('index', i)
                console.log('img', img.public_id)
                // add bucket src to Image
                let image = new Image({
                    id: img.public_id,
                    filename: img.original_filename,
                    title: 'image',
                    photographer: 'NA',
                    description: 'A puppy',
                    src: img.secure_url,
                    alt: 'a puppy',
                    contentType: img.format,
                    path: 'NA'
                })
                counter++
                console.log('RESOLVING')
                resolve(image)
            }).catch(e => {
                console.error(`An error occured: ${e}`)
                reject(`An error occured: ${e}`)
            })
        }))
    })
    // create another array of promise
    let finishPromises = []
    // loop over array of pending promises
    imgPromises.forEach((promise) => {
        console.log('promise', promise)
        finishPromises.push(new Promise((resolve, reject) => {
            promise.then(img => {
                // imgs.forEach(img => {
                console.log('img', img)
                // Image.remove({}, () => {
                // let promise = Image.findOne({path: pathName}).exec()
                Image.find({id: img.id}).exec().then(check => {
                    // check make sure not already in db- double save
                    if (check.length <= 0) {
                        let result = img.save()

                        result.then(image => {
                            console.log(`saved: ${img.id}`)
                            resolve('saved to db')
                            // req.flash('success', 'Image Saved')
                            // res.send('saved')
                        }).catch(e => {
                            console.error(`image not saved, ${e}`)
                            // req.flash('error', `Image not Saved: ${e}`);
                            // res.redirect('single-seed')
                            reject(`reject :Image not Saved: ${e}`)
                        })
                    } else {
                        console.error('Not saved. This is already in the db.')
                    }
                })

            })
        }))
    })
    // })
    // Image.remove({}, () => {
    // let result = image.save()
    //
    // result.then(image => {
    //     console.log('saved')
    //     counter++
    //      req.flash('success', 'Image Saved')
    //      res.send('saved')
    // }).catch(e => {
    //     console.log(`image not saved, ${e}`)
    //      req.flash('error', `Image not Saved: ${e}`);
    //      res.redirect('single-seed')
    // })
    // })
    // }).catch(err => {
    //     console.error('An error occured', err)
    //     res.send('An error at the end of the promise')
    // })
    // })
    // if(counter === promiseArr.length){
    //     resolve('complete')
    // }
    return Promise.all((finishPromises)).then((result) => {
        // req.flash('success', 'Image Saved')
        console.log('SAVED')
        res.send('saved')
        return
    })
}
function addFile(req, res) {
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
function setDimImages(dir) {
    let files = fs.readdirSync(dir)
    files.splice(0, 2)
    files.splice(6, 2)
    files.splice(7, 1)
    files.splice(8, 1)
    files.splice(8, 1)
    return files
}
function filterImages(stubsArr, dir) {
    let result = []
    let files = fs.readdirSync(dir)

    files.forEach(file => {
        stubsArr.forEach(stub => {
            if (file.includes(stub)) {
                result.push(file)
            }

        })
    })
    return result
}
