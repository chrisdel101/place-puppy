const mongoose = require('mongoose')
const imageController = require('./controllers/images.controller')
const Image = mongoose.models.Image || require('../models/image.model.js')
const fs = require('fs')
const cloudinary = require('cloudinary')
const url = require('url')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

module.exports = {
    fullSeed: fullSeed,
    createPromises: createPromises,
    addToDb: addToDb,
    filterImages: filterImages,
    cloudinaryUploader: cloudinaryUploader,
    extractDims: extractDims,
    removeFwdSlash: removeFwdSlash,
    passwordVerify: passwordVerify,
    sessionCheck: sessionCheck
}

// check password length
function passwordVerify(pw) {
    if (typeof pw !== 'string') {
        error('verify: fire must be a string block')
        return false
    }
    if (pw.length < 8) {
        error('verify: fire too short block')
        return false
    }
    return true
}
function removeFwdSlash(str) {
    // 	check if starts with /
    let re = /^\//ig
    if (str.match(re)) {
        return str.slice(1, str.length)
    }
    return str
}
function extractDims(str) {
    if (typeof str !== 'string') {
        error('Incorrect input: Needs to be a string')
        throw new TypeError('Incorrect input: Needs to be a string')
    }
    // all nums before x starting with / - to extract
    let re = /\/\d+(?=\x)/g
    // all nums before x, no /
    let re2 = /\d+(?=\x)/g
    // to help with the reverse - no /
    let re3 = /\d+(?=\x)/g
    // look for dims pattern
    let re4 = /([0-9]+[x][0-9]+)/
    // check if string is a Url
    if (isValidURL(str)) {
        log('extractDims: is valid URL')
        let newUrl = url.parse(str)
        // check str has the 100x100 format
        if (!newUrl.pathname.match(re)) {
            throw TypeError('extractDims error: input url does not have dims to extract, or the dims are not in the right format. Must be in the pathname or url.')
        }
        // WIDTH
        // get first num
        let width = newUrl.pathname.match(re).join('')
        // remove /
        width = removeFwdSlash(width)
        // HEIGHT
        // reverse String - then use join
        let reverseUrl = Array.from(newUrl.pathname).reverse().join('')
        // extract digits -
        let height = reverseUrl.match(re3).join('')
        // un-reverse back to normal
        height = Array.from(height).reverse().join('')
        // remove /
        height = removeFwdSlash(height)
        log('width', width)
        log('height', height)
        return {width: width, height: height}
    } else {
        if (!str.match(re4)) {
            throw TypeError('extractDims error: input does not contain dims i.e. 100x100 neeeded for extract')
        }
        log('extractDims: is not valid URL but still extract')
        // if not valid url follow, cannot parse out using url mod  above
        let extractDim = str.match(re4)[0]
        let width = extractDim.match(re2).join('')
        // reverse the dims
        let reverseDim = Array.from(extractDim).reverse().join('')
        // extract up until x - then use join to str
        let height = reverseDim.match(re2).join('')
        height = Array.from(height).reverse().join('')
        let obj = {
            width: width,
            height: height
        }
        log('width/height', obj)
        return obj
    }
    return undefined
}
function fullSeed(req, res) {
    // console.log('image id', publicImageId)
    // if global let is set, delete
    // if (publicImageId) {
    //     cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
    //         console.log('deleted')
    //          res.send(result)
    //     })
    // }
    // add dir to seed
    let files = fs.readdirSync("./public/dev-images/seeds-copy")
    // filter out ext not in arr
    files = filterImages([
        'jpg', 'png'
    ], "./public/dev-images/seeds-copy")
    // add call add db with createPromises as an arg
    return addToDb(createPromises(files, "./public/dev-images/seeds-copy"), req, res)

}
// makes array of promises with image files to upload
function createPromises(files, dir) {
    try {
        let arr = []
        files.forEach((file) => {
            console.log('file', file)
            // make str for file
            let src = `${dir}/${file}`
            // add new image to loader
            let promise = cloudinaryUploader(src)
            log('push in cloudinaryUploader')
            arr.push(promise)
        })
        return arr
    } catch (err) {
        error('An error occured in seeding:', err)
    }

}
// takes array of promises with req and res
function addToDb(promiseArr, req, res) {
    // create array of promises with cloud strs
    let imgPromises = []
    promiseArr.forEach((promise, i) => {
        counter = 1
        imgPromises.push(new Promise((resolve, reject) => {
            promise.then(img => {
                log('img', img.public_id)
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
                log('RESOLVING')
                resolve(image)
            }).catch(e => {
                error(`An error occured: ${e}`)
                reject(`An error occured: ${e}`)
            })
        }))
    })
    // create another array of promise
    let finishPromises = []
    // loop over array of pending promises
    imgPromises.forEach((promise) => {
        log('promise', promise)
        finishPromises.push(new Promise((resolve, reject) => {
            promise.then(img => {
                // imgs.forEach(img => {
                log('img', img)
                // find each img in db
                Image.find({id: img.id}).exec().then(check => {
                    // check make sure not already in db- double save
                    if (check.length <= 0) {
                        let result = img.save()
                        // if success
                        result.then(image => {
                            log(`saved: ${img.id}`)
                            resolve('saved to db')
                        }).catch(e => {
                            error(`image not saved, ${e}`)
                            reject(`reject :Image not Saved: ${e}`)
                        })
                    } else {
                        error('Not saved. This is already in the db.')
                    }
                })

            })
        }))
    })
    return Promise.all((finishPromises)).then((result) => {
        // req.flash('success', 'Image Saved')
        console.log('SAVED')
        res.send('saved')
        return
    })
}
function filterImages(stubsArr, dir) {
    let result = []
    let files = fs.readdirSync(dir)
    // get all files that include the stubs
    files.forEach(file => {
        stubsArr.forEach(stub => {
            if (file.includes(stub)) {
                result.push(file)
            }
        })
    })
    return result
}
function cloudinaryUploader(image) {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(image, {
            timeout: 10000000
        }, (err, result) => {
            if (err) {
                error('Error in the cloudinary loader', err)
                reject(error)
            } else {
                log('result', result)
                resolve(result)
            }
        })

    })
}
https : //stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url/22648406#22648406
function isValidURL(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

function sessionCheck(req, res){
    if (!req.session.user) {
        error('Cannot access route before login. Visit /login.')
        return res.status(401).send()
    }
    return true
}
