const fs = require('fs')
const dir = `./public/public-images/error-page`
const { extractDims, isValidURL, filterImages } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

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
      console.log('dir', dirs)
      dirs.forEach((imgDir) => {
        log('imgDir', imgDir)
        let filesArr = fs.readdirSync(`${dir}/${imgDir}`)
        // loop over dir and make into valid paths
        let imgStrs = filesArr.map((file) => {
          return `./public-images/error-page/${imgDir}/${file}`
        })
        // log('imgStrs', imgStrs)
        let obj = module.exports.makeDogObj(imgStrs)
        imgObjs.push(obj)
      })
      log('imgObjs', imgObjs)
      errorObj.errMsg = module.exports.setErrorMessage(errorObj)
      return res.render('error', {
        imgObjs,
        errorObj,
      })
    })
    return 'HEllo'
  },
  // make an obj to use in the template
  makeDogObj: (dogFolderArr) => {
    var sm = /-sm\./
    var md = /-md\./
    var cn = /-cn\./
    var lg = /-lg\./
    var fs = /-fs\./

    let dogObj = {}
    dogFolderArr.forEach((dogFile) => {
      log('dogfile', dogFile)
      if (dogFile.match(sm)) {
        dogObj['sm'] = dogFile
      } else if (dogFile.match(md)) {
        dogObj['md'] = dogFile
      } else if (dogFile.match(cn)) {
        dogObj['cn'] = dogFile
      } else if (dogFile.match(lg)) {
        dogObj['lg'] = dogFile
      } else if (dogFile.match(fs)) {
        dogObj['fs'] = dogFile
      } else {
        log('No files match the size sm, md, cn, or lg')
        log(`nothing from ${dogFile} put in dogObj`)
      }
    })
    log('dogObj', dogObj)
    return dogObj
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
