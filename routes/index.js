const express = require('express');
var router = express.Router();
const Image = require('../logic/models/image.model')
const imageController = require('../logic/controllers/images.controller')
const sessionsController = require('../logic/controllers/sessions.controller')
const usersController = require('../logic/controllers/users.controller')
const indexController = require('../logic/controllers/index.controller')
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const cloudinary = require('cloudinary')
let publicImageId = ''
const fs = require('fs')
/* GET home page. */
router.get('/', indexController.showIndex)
// /Users/chrisdielschnieder/desktop/code_work/cs50/pset9/placepuppy/routes/users.js
// res.render('index', { title: req.app.locals.title });
// });
// router.get('/:id', imageController.showImage)
router.get('^/:dimensions([0-9]+[x][0-9]+)', imageController.showImage)
// {
//   let val
//   let valObj
//    if starts with / remove it
//   if(imageController.removeFwdSlash(req)){
//       val = imageController.removeFwdSlash(req)
//   }
//    if in correct format
//   console.log('val', val)
//   console.log('func', imageController.numFormat(val))
//   if(imageController.numFormat(val)){
//        return two num vals
//       valObj = imageController.extractDims(val)
//   }
//   imageController.showImage(req, res)
//   console.log(valObj)
// res.send(valObj)

// });

router.get('/login', sessionsController.loginDisplay)
router.post('/login', sessionsController.login)

router.get('/register', usersController.registerDisplay)
router.post('/register', usersController.register)

router.get('/see-db', function(req, res) {
    console.log('image id', publicImageId)
    if (publicImageId) {
        cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
            console.log('deleted')
            res.send(result)
        })
    }
    // cloudinary.v2.search.expression("_id: 5b9eb63e36ebee0dd9d22cc4").execute(function(error, result) {
    //     console.log(result)
    // });
})
router.get('/full-seed', imageController.fullSeed)

// hit route to add a single image to db, and to cloudinary
router.get('/single-seed', (req, res) => {
    // delete previous from cloudinary
    console.log('image id', publicImageId)
    if (publicImageId) {
        cloudinary.v2.api.delete_resources([publicImageId], function(error, result) {
            console.log('deleted')
            // res.send(result)
        })
    }
    // add new image from this dir
    let promise = imageController.cloudinaryUploader(`${__dirname}/IMG_8010--2--NS.jpg`)
    promise.then(img => {
        console.log(img)
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
                console.log('saved')
                req.flash('success', 'Image Saved')
                res.send('saved')
            }).catch(e => {
                console.log(`image not saved, ${e}`)
                req.flash('error', `Image not Saved: ${e}`);
                res.redirect('single-seed')
            })
        })
    }).catch(err => {
        console.error('An error occured', err)
        res.send('An error at the end of the promise')
    })
})
// admin routes
router.get('/add', imageController.addFile)
//  needs to match form val and name
router.post('/add', upload.single('file'), imageController.add)
//
router.get('/images', imageController.showImages)

router.get('/test', () => {
    // function _createPromises(files) {
    //     let arr = []
    //     files.forEach((file) => {
    //         console.log('file', file)
    //          let file = `adorable-animal-canine-163685.jpg`
    //          let src = `./public/public-images/dim-images/${file}`
    //           add new image\\
    //          let promise = cloudinaryUploader(src)
    //          console.log('push in cloudinaryUploader')
    //         arr.push(file)
    //          console.log(promise)
    //     })
    //     return arr
    // }
    // let files = fs.readdirSync("./public/public-images/dim-images")
    // _createPromises(files)

    // MAKE JSON
    // let promise = Image.find({contentType: /(jpg|png)/}).exec()
    // promise.then(puppies => {
    //     puppies = JSON.stringify(puppies)
    //     console.log(puppies)
    //     fs.writeFile('./json/puppy.json', puppies, (err) => {
    //         if(err) console.error(err)
    //         console.log('file done')
    //         })
    //     })
    // INSERTJSON
    // let arr = require("../json/puppy.json")
    // arr = JSON.parse(JSON.stringify(arr))
    // console.log(arr)
    // Image.insertMany(arr)
    // .then(data => {
    //     data.save()
    //     console.log('saved')
    // })
    // DROP INDEXES
    // Image.collection.dropAllIndexes((err, results) => {
    //     if (err)
    //         console.error(err)
    //     console.log('dropped')
    // })

    // DELETE MANY
    Image.deleteMany({ path: "NA"}, (err) =>  {
        if(err) console.error(err)
        console.log('deleted')
    })

})

module.exports = router;
