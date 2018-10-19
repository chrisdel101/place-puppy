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
const {sessionCheck, fullSeed, displayCloud, cloudinaryUploader, singleSeed} = require('../logic/utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const session = require('express-session')

// show index
router.get('/', indexController.showIndex)
// show img- use middleware when returning img dims
router.get('^/:dimensions([0-9]+[x][0-9]+)', imageMiddleware.qualityMiddleware, imageMiddleware.returnImageFormat, (req, res) => {
    console.log('format', req.format)
    imageController.showImage(req, res, req.quality, req.format)
})
// show forgot password
router.get('/forgot', usersController.forgotPasswordView)
// send email
router.post('/forgot', usersController.forgotPassword)
// send user token
router.get('/reset/:token', usersController.pwTokenGet)
// change user password
router.post('/reset/:token', usersController.pwTokenPost)

// see all data in cloud
router.get('/see-cloud', (req, res) => {
    if(!sessionCheck(req, res)) return
    displayCloud(req, res)
})
// build a form for this one
router.get('delete-cloud-resource', (req, res) => {
    sessionCheck(req, res)
     // take inputs
    deleteCloudResource()
})
// seed the db
router.get('/full-seed', (req, res) => {
    if(!sessionCheck(req, res)) return
    fullSeed(req, res)
})
// add a ingle sees
// hit route to add a single image to db, and to cloudinary- needs a form too
router.get('/single-seed', (req, res) => {
    if(!sessionCheck(req, res)) return
    let url = `${__dirname}/adorable-animal-breed-1108099.jpg`
    singleSeed(req, res, url)
})
// login
router.get('/login', sessionsController.loginDisplay)
router.post('/login', sessionsController.login)
// logout
router.get('/logout', sessionsController.logoutDisplay)
router.post('/logout', sessionsController.logout)
// register
router.get('/register', usersController.registerDisplay)
router.post('/register', usersController.register)
// add image
router.get('/add', imageController.addFile)
//  needs to match form val and name -using middleware
router.post('/add', upload.single('file'), imageController.add)
// show images
router.get('/images', imageController.showImages)

// routes for data manipulation
// MAKE JSON
router.get('/make-json', (req, res) => {

    if(!sessionCheck(req, res)) return
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
router.get('/insert-json', (req, res) => {
    // no access without login
    if(!sessionCheck(req, res)) return
    let arr = require("../json/puppy.json")
    arr = JSON.parse(JSON.stringify(arr))
    console.log(arr)
    Image.insertMany(arr).then(data => {
        data.save()
        console.log('saved')
    })

})
// DROP INDEXES
router.get('/drop-indexes', (req, res) => {
    // no access without login
    if(!sessionCheck(req, res)) return
    Image.collection.dropAllIndexes((err, results) => {
        if (err)
            console.error(err)
        console.log('dropped')
    })

})
// DELETE MANY
router.get('/delete-many', (req, res) => {
    // no access without login
    if(!sessionCheck(req, res)) return
    Image.deleteMany({
        path: null
    }, (err) => {
        if (err)
            error(err)
        log('deleted')
    })
})

module.exports = router
