const fs = require('fs')
const dir = `./public/public-images/index-page`
const {extractDims, isValidURL, filterImages } = require('../utils')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

module.exports = {
    showIndex: (req, res) => {
        // read dir of dirs
        fs.readdir(dir, (err, dirs) => {
            if (err) {
                error('An error occured', err)
                req.flash('error', 'An error occured')
                return res.redirect('/')
            }
            // filter out non-image dirs
            dirs = filterImages(['image'], dir)
            let imgObjs = []
            console.log('dir', dirs)
            dirs.forEach(imgDir => {
                log('imgDir', imgDir)
                let filesArr = fs.readdirSync(`${dir}/${imgDir}`)
                // loop over dir and make into valid paths
                let imgStrs = filesArr.map(file => {
                    return `./public-images/index-page/${imgDir}/${file}`
                })
                // log('imgStrs', imgStrs)
                let obj = module.exports.makeDogObj(imgStrs)
                imgObjs.push(obj)
            })
            log('imgObjs', imgObjs)
            return res.render('index', {imgObjs: imgObjs})
        })
    },
    // make an obj to use in the template
    makeDogObj: (dogFolderArr) => {
        var sm = /-sm\./
        var md = /-md\./
        var cn = /-cn\./
        var lg = /-lg\./
        var fs = /-fs\./

        let dogObj = {}
        dogFolderArr.forEach(dogFile => {
            if (dogFile.match(sm)) {
                dogObj['sm'] = dogFile
            } else if (dogFile.match(md)) {
                dogObj['md'] = dogFile
            } else if (dogFile.match('cn')) {
                dogObj['cn'] = dogFile
            } else if (dogFile.match(lg)) {
                dogObj['lg'] = dogFile
            } else if (dogFile.match(fs)) {
                dogObj['fs'] = dogFile
            } else {
                log('No files match the size params')
            }
        })
        log('dogObj', dogObj)
        return dogObj
    }
}
