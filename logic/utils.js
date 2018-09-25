const mongoose = require('mongoose')
const imageController = require('./controllers/images.controller')
const Image = mongoose.models.Image || require('../models/image.model.js')
const fs = require('fs')

module.exports = {
    fullSeed: fullSeed,
    createPromises: createPromises,
    addToDb: addToDb,
    filterImages: filterImages
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
