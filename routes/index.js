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
  // run strip first; if strip occurs other two don't run
  imageMiddleware.stripInvalidQueryParams,
  imageMiddleware.qualityMiddleware,
  imageMiddleware.returnImageType,
  (req, res) => {
    imageController.showImage(req, res)
  }
)

module.exports = router
