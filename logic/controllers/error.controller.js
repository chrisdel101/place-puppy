const fs = require('fs')
const dir = `./public/public-images/error-page`
const { filterImages } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const indexController = require('./index.controller')

module.exports = {
  showErrorPage: (req, res, error = {}) => {
    console.log('ERR', error)
    let imgObjs = [
      {
        sm: './public-images/error-page/250x172-sm.jpg',
        md: './public-images/error-page/400x275-md.jpg',
        lg: './public-images/error-page/550x380-lg.jpg',
        fs: './public-images/error-page/650x488-fs.jpg',
      },
    ]
    error.errMsg = module.exports.setErrorMessage(error)
    if (!error.status) error.status = 500
    console.log('STA', error)
    return res.render('error', {
      imgObjs,
      error,
    })
  },
  setMissingStatus(errObj) {
    if (!errObj.status === 404) {
      return "We didn't find what you're looking for here."
    } else if (errObj.status == 500) {
      return 'A server error occured.'
    } else {
      if (errObj?.errMsg) {
        return 'A server error occured.'
      } else {
        return 'An error occured.'
      }
    }
  },
  setErrorMessage(errObj) {
    if (errObj.status === 404) {
      return "We didn't find what you're looking for here."
    } else if (errObj.status == 500) {
      return 'A server error occured.'
    } else {
      if (errObj?.errMsg) {
        return 'A server error occured.'
      } else {
        return 'An error occured.'
      }
    }
  },
}
