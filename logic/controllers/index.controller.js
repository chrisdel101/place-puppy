const fs = require('fs');
const dir = `./public/public-images/index-page-copy`
const {extractDims, isValidURL, filterImages} = require('../utils')

module.exports = {
    showIndex: (req, res) => {
        // read dir of dirs
        fs.readdir(dir, (err, dirs) => {
            if (err)
                console.error(err)
                // dogsArr = dogsArr.map(dogStr => {
            //     return `../public-images/index-page/image1/${dogStr}`
            // })
            // filter out non-image dirs
            dirs = filterImages(['image'], dir)
            let imgObjs = []
            console.log('dir', dirs)
            dirs.forEach(imgDir => {
                console.log('imgDir', imgDir)
                let filesArr = fs.readdirSync(`${dir}/${imgDir}`)
                // loop over dir and make into valid paths
                let imgStrs = filesArr.map(file => {
                    return `./public-images/index-page/${imgDir}/${file}`
                })
                console.log('imgStrs', imgStrs)
                let obj = module.exports.makeDogObj(imgStrs)
                imgObjs.push(obj)
            })

            // make dogs array, filter out other files
            // let dogStrs = dogsArr.map(dog => {
            //     return `./public-images/index-page/image1/${dog}`
            // }).filter(dogStr => {
            //     return dogStr.includes('jpg')
            // })
            console.log('imgObjs', imgObjs)
            // let dogsObj = module.exports.makeDogObj(dogsArr)
            // console.log('dogObj', dogsObj)
            res.render('index', {imgObjs: imgObjs})
        });
    },
    makeDogObj: (dogFolderArr) => {
        var sm = /-sm\./
        var md = /-md\./
        var lg = /-lg\./
        var fs = /-fs\./

        let dogObj = {}
        dogFolderArr.forEach(dogFile => {
            if (dogFile.match(sm)) {
                dogObj['sm'] = dogFile
            } else if (dogFile.match(md)) {
                dogObj['md'] = dogFile
            } else if (dogFile.match(lg)) {
                dogObj['lg'] = dogFile
            } else if (dogFile.match(fs)) {
                dogObj['fs'] = dogFile
            } else {
                console.log('No files match the size params')
            }
        })

        return dogObj
    }
}
