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

// router.post('/', imageController.addImmage)

router.get('/add', imageController.addFile)

router.post('/add', upload.single('productImage'), imageController.uploadFile)

module.exports = router;
