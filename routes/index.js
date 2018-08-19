var express = require('express');
var router = express.Router();
const imageController = require('../logic/controllers/image.controller')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', imageController.addImmage)

router.get('/add', imageController.addFile)

module.exports = router;
