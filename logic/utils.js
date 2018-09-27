const mongoose = require('mongoose')
const imageController = require('./controllers/images.controller')
const Image = mongoose.models.Image || require('../models/image.model.js')
const fs = require('fs')
const cloudinary = require('cloudinary')
const url = require('url')

module.exports = {
    fullSeed: fullSeed,
    createPromises: createPromises,
    addToDb: addToDb,
    filterImages: filterImages,
    cloudinaryUploader: cloudinaryUploader,
    extractDims: extractDims,
    removeFwdSlash: removeFwdSlash
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
        let error = new TypeError('Incorrect input: Needs to be a string')
        throw error
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
        console.log('he', height)
        // un-reverse back to normal
        height = Array.from(height).reverse().join('')
        console.log(height)
        // remove /
        height = removeFwdSlash(height)
        return {width: width, height: height}
    } else {
        if (!str.match(re4)) {
            throw TypeError('extractDims error: input does not contain dims i.e. 100x100 neeeded for extract')
        }
        let extractDim = str.match(re4)[0]
        let width = extractDim.match(re2).join('')
        // reverse the dims
        let reverseDim = Array.from(extractDim).reverse().join('')
        // extract up until x - then use join to str
        let height = reverseDim.match(re2).join('')
        // console.log(height.join(''))
        height = Array.from(height).reverse().join('')
        return {width: width, height: height}
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

    // let files = fs.readdirSync("./public/public-images/single")

    let files = filterImages([
        'jpg', 'png'
    ], "./public/public-images/single")

    addToDb(createPromises(files, "./public/public-images/single"), req, res)
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
// makes array of promises with image files to upload
function createPromises(files, dir) {
    let arr = []
    files.forEach((file) => {
        console.log('file', file)
        // let file = `adorable-animal-canine-163685.jpg`
        let src = `${dir}/${file}`
        // add new image\\
        let promise = imageController.cloudinaryUploader(src)
        // console.log('push in cloudinaryUploader')
        arr.push(promise)
        // console.log(promise)
    })
    return arr
}
function addToDb(promiseArr, req, res) {
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
https : //stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url/22648406#22648406
function isValidURL(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}
