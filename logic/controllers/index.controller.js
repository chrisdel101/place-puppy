const fs = require('fs')
const dir = `./public/public-images/index-page`
const { filterImages, hasFileExtension } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

module.exports = {
  showIndex: (req, res) => {
    // read dir of dirs
    fs.readdir(dir, (err, dirs) => {
      if (err) {
        error('An error occured', err)
        req.flash('error', `An error occured: ${err}`)
        return res.redirect('/')
      }
      // filter out non-image dirs
      dirs = filterImages(['image'], dir)
      let imgObjs = []
      dirs.forEach((imgDir) => {
        let filesArr = fs.readdirSync(`${dir}/${imgDir}`)
        // loop over dir and make into valid paths
        let imgStrs = filesArr.map((file) => {
          return `./public-images/index-page/${imgDir}/${file}`
        })
        let obj = module.exports.makeDogObj(imgStrs)
        imgObjs.push(obj)
      })
      log('imgObjs', imgObjs)
      return res.render('index', { imgObjs: imgObjs })
    })
  },
  // make an obj to use in the template
  makeDogObj: (dogFolderArr) => {
    var sm = /-sm\./
    var md = /-md\./
    var cn = /-cn\./
    var lg = /-lg\./
    var fs = /-fs\./

    let dogDTO = {}
    dogFolderArr.forEach((dogFilePath) => {
      if (dogFilePath.match(sm)) {
        dogDTO['sm'] = dogFilePath
      } else if (dogFilePath.match(md)) {
        dogDTO['md'] = dogFilePath
      } else if (dogFilePath.match(cn)) {
        dogDTO['cn'] = dogFilePath
      } else if (dogFilePath.match(lg)) {
        dogDTO['lg'] = dogFilePath
      } else if (dogFilePath.match(fs)) {
        dogDTO['fs'] = dogFilePath
      } else {
        const lastItemInPath = dogFilePath?.split('/')?.slice(-1).join('')
        const imgFile = hasFileExtension(lastItemInPath)
        if (imgFile) {
          dogDTO[lastItemInPath] = dogFilePath
        }
      }
    })
    return dogDTO
  },
}
