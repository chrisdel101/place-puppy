const fs = require('fs')
const dir = `./public/public-images/error-page`
const { filterImages } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const indexController = require('./index.controller')

module.exports = {
  showErrorPage: (req, res, errorObj = {}) => {
    let imgObjs = [
      {
        sm: './public-images/error-page/image1/250x172-sm.jpg',
        md: './public-images/error-page/image1/400x275-md.jpg',
        lg: './public-images/error-page/image1/550x380-lg.jpg',
        fs: './public-images/error-page/image1/650x488-fs.jpg',
      },
    ]
    errorObj.errMsg = module.exports.setErrorMessage(errorObj)
    return res.render('error', {
      imgObjs,
      errorObj,
    })
  },
  setErrorMessage(errObj) {
    if (errObj.status === 404) {
      return "We didn't find what you're looking for here."
    } else if (errObj.status == 500) {
      return 'A server error occured.'
    } else {
      return 'An error occured.'
    }
  },
}
