const fs = require('fs');
const dir = `./public/public-images/index-page/image1`
const { extractDims, isValidURL } = require('../utils')

module.exports = {
    showIndex: (req, res) => {
        console.log('dir', dir)
        fs.readdir(dir, (err, dogsArr) => {
            if (err)
                console.error(err)
                console.log('dogsArr', dogsArr)

                // make dogs array, filter out other files
            let dogStrs = dogsArr.map(dog => {
                return `./public-images/index-page/image1/${dog}`
            }).filter(dogStr => {
                return dogStr.includes('jpg')
            })

            console.log('dogStr', dogStrs)
            res.render('index', {dogStrs: dogStrs})
        });
    },
    makeDogObj: (dogFolderArr) =>   {
        var sm = /-sm\./
        var md = /-md\./
        var lg = /-lg\./
        var fs = /-fs\./

        let dogObj = {}
        dogFolderArr.forEach(dogFile => {
            if(dogFile.match(sm)){
                dogObj['sm'] = dogFile
            } else if(dogFile.match(md)){
                dogObj['md'] = dogFile
            } else if(dogFile.match(lg)){
                dogObj['lg'] = dogFile
            } else if(dogFile.match(fs)){
                dogObj['fs'] = dogFile
            } else {
                log('No files match the size params')
            }
        })
    }
}
