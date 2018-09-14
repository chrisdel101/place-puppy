var express = require('express');
var router = express.Router();
const imageController = require('../logic/controllers/images.controller')
const sessionsController = require('../logic/controllers/sessions.controller')
const usersController = require('../logic/controllers/users.controller')
const multer = require('multer')
const upload = multer({dest:'uploads/'})
var app = express()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: req.app.locals.title });
});

// router.get('/:id', function(req, res, next) {
//   res.send('hello')
// });

router.get('/login', sessionsController.loginDisplay )
router.post('/login', sessionsController.login )



router.get('/register', usersController.registerDisplay )
router.post('/register', usersController.register )



// admin routes
router.get('/add', imageController.addFile)
// // needs to match form val and name
router.post('/add', upload.single('file'), imageController.add)
//
router.get('/images', imageController.showImages)
// var x = imageController.showImage()
// console.log('x', x  )
// console.log(imageContoll, imageController.outReq)
// router.get('/:100x100',imageController.showImage)
// router.get('/')
let i = 0
while(i < 999){
    let route = `/${i}x${i}`
    router.get(route, (req, res) => {
        console.log(route)
        res.send(`sending ${route}`)
    })
    i++
}


module.exports = router;
