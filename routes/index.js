const express = require('express')
const router = express.Router()
const Image = require('../logic/models/image.model')
const imageController = require('../logic/controllers/images.controller')
const sessionsController = require('../logic/controllers/sessions.controller')
const usersController = require('../logic/controllers/users.controller')
const indexController = require('../logic/controllers/index.controller')
const imageMiddleware = require('../logic/middleware/images.middleware.js')
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const cloudinary = require('cloudinary')
let publicImageId = ''
const fs = require('fs')
const { sessionCheck, fullSeed } = require('../logic/utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const session = require('express-session')

router.get('/', indexController.showIndex)
router.get('^/:dimensions([0-9]+[x][0-9]+)', imageMiddleware.qualityMiddleware, imageMiddleware.returnImageFormat, (req, res) => {
    imageController.showImage(req, res, req.quality, req.format)
})

router.get('/forgot', usersController.forgotPasswordView)
router.post('/forgot', usersController.forgotPassword)
router.get('/reset/:token', usersController.pwTokenGet)
router.post('/reset/:token', usersController.pwTokenPost)

router.get('/see-db', function(req, res) {
    console.log('image id', publicImageId)
    if (publicImageId) {
        cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
            log('deleted')
            res.send(result)
        })
    }
    // cloudinary.v2.search.expression("_id: 5b9eb63e36ebee0dd9d22cc4").execute(function(error, result) {
    //     console.log(result)
    // })
})
router.get('/full-seed', fullSeed)

// hit route to add a single image to db, and to cloudinary
router.get('/single-seed', (req, res) => {
    // delete previous from cloudinary
    console.log('image id', publicImageId)
    if (publicImageId) {
        cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
            log('deleted')
            // res.send(result)
        })
    }
    // add new image from this dir
    let promise = imageController.cloudinaryUploader(`${__dirname}/IMG_8010--2--NS.jpg`)
    promise.then(img => {
        log('img', img)
        publicImageId = img.public_id
        // add bucket src to Image
        let image = new Image({
            filename: 'Some file',
            title: 'Single seeded puppy',
            photographer: 'NA',
            description: 'A seeded puppy',
            src: img.secure_url,
            contentType: 'image/jpg',
            path: '400x400'
        })
        // remove all dogs everytime
        Image.remove({}, () => {
            let promise = image.save()

            promise.then(image => {
                log('saved')
                req.flash('success', 'Image Saved')
                res.send('saved')
            }).catch(e => {
                log(`image not saved, ${e}`)
                req.flash('error', `Image not Saved: ${e}`)
                res.redirect('single-seed')
            })
        })
    }).catch(err => {
        error('An error occured', err)
        res.send('An error at the end of the promise')
    })
})
// admin routes

router.get('/login', sessionsController.loginDisplay)
router.post('/login', sessionsController.login)

router.get('/logout', sessionsController.logoutDisplay)
router.post('/logout', sessionsController.logout)

router.get('/register', usersController.registerDisplay)
router.post('/register', usersController.register)
router.get('/add', imageController.addFile)
//  needs to match form val and name -using middleware
router.post('/add', upload.single('file'), imageController.add)
//
router.get('/images', imageController.showImages)


// routes for data manipulation
// MAKE JSON
router.get('make-json', (req,res) => {
    // no access without login
    sessionCheck(req, res)
    let promise = Image.find({contentType: /(jpg|png)/}).exec()
    promise.then(puppies => {
        puppies = JSON.stringify(puppies)
        console.log(puppies)
        fs.writeFile('./json/puppy.json', puppies, (err) => {
            if (err)
                console.error(err)
            console.log('file done')
        })
    })
})
// INSERTJSON
router.get('insert-json', (req, res) => {
    // no access without login
    sessionCheck(req, res)
    let arr = require("../json/puppy.json")
    arr = JSON.parse(JSON.stringify(arr))
    console.log(arr)
    Image.insertMany(arr).then(data => {
        data.save()
        console.log('saved')
    })

})
// DROP INDEXES
router.get('/drop-indexes', (req,res) => {
    // no access without login
    sessionCheck(req, res)
    Image.collection.dropAllIndexes((err, results) => {
        if (err)
            console.error(err)
        console.log('dropped')
    })

})
// DELETE MANY
router.get('/delete-many', (req,res) => {
    // no access without login
    sessionCheck(req, res)
    Image.deleteMany({
        path: "NA"
    }, (err) => {
        if (err)
            error(err)
        log('deleted')
    })
})

module.exports = router
