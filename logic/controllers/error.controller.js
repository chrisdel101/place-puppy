const fs = require('fs')
const dir = `./public/public-images/error-page`
const { filterImages } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const indexController = require('./index.controller')

module.exports = {
  showErrorPage: (req, res, errorObj = {}) => {
    // read dir of dirs
    return fs.readdir(dir, (err, dirs) => {
      if (err) {
        error('An error occured', err)
        req.flash('error', 'An error occured')
        return res.redirect('/')
      }
      // filter out non-image dirs
      dirs = filterImages(['image'], dir)
      let imgObjs = []
      dirs.forEach((imgDir) => {
        let filesArr = fs.readdirSync(`${dir}/${imgDir}`)
        // loop over dir and make into valid paths
        let imgStrs = filesArr.map((file) => {
          return `./public-images/error-page/${imgDir}/${file}`
        })
        // log('imgStrs', imgStrs)
        let obj = indexController.makeDogObj(imgStrs)
        imgObjs.push(obj)
      })
      error('error imgObjs', imgObjs)
      errorObj.errMsg = module.exports.setErrorMessage(errorObj)
      return res.render('error', {
        imgObjs,
        errorObj,
      })
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
