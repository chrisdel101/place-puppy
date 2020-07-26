const express = require('express')
const router = express.Router()
const Image = require('../logic/models/image.model')
const imageController = require('../logic/controllers/images.controller')
const sessionsController = require('../logic/controllers/sessions.controller')
const usersController = require('../logic/controllers/users.controller')
const indexController = require('../logic/controllers/index.controller')
const imageMiddleware = require('../logic/middleware/images.middleware.js')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const cloudinary = require('cloudinary')
let publicImageId = ''
const fs = require('fs')
const {
  sessionCheck,
  fullSeed,
  displayCloud,
  cloudinaryUploader,
  singleSeed,
} = require('../logic/utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const session = require('express-session')

// show index
router.get('/', indexController.showIndex)
// show img- use middleware when returning img dims
router.get(
  '^/:dimensions([0-9]+[x][0-9]+)',
  imageMiddleware.qualityMiddleware,
  imageMiddleware.returnImageFormat,
  (req, res) => {
    console.log('HERE ')
    console.log('format', req.format)
    imageController.showImage(req, res, req.quality, req.format)
  }
)

module.exports = router
