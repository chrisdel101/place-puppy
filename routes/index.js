const express = require('express')
const router = express.Router()
const imageController = require('../logic/controllers/images.controller')
const indexController = require('../logic/controllers/index.controller')
const imageMiddleware = require('../logic/middleware/images.middleware.js')

// show index
router.get('/', indexController.showIndex)
// show img- use middleware when returning img dims
router.get(
  '^/:dimensions([0-9]+[x][0-9]+)',
  imageMiddleware.qualityMiddleware,
  imageMiddleware.returnImageFormat,
  imageMiddleware.stripInvalidQueryParams,
  (req, res) => {
    imageController.showImage(req, res)
  }
)

module.exports = router
