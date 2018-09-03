var express = require('express');
var router = express.Router();
const imageController = require('../logic/controllers/image.controller')
const multer = require('multer')
const upload = multer({dest:'uploads/'})
var app = express()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



// admin routes
router.get('/add', imageController.addFile)
// needs to match form val and name
router.post('/add', upload.single('file'), imageController.uploadFile)
//
// router.get('/images', imageController.showImages)


router.get('/100x100', imageController.showImage)



module.exports = router;
