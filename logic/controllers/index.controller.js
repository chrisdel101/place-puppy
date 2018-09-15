const fs = require('fs');
const dir = `./public/images`

module.exports = {
    showIndex: (req, res) => {
        fs.readdir(dir, (err, dogsArr) => {
            if (err) console.error(err)
            // make dogs array, filter out other files
            let dogStrs = dogsArr
            .map(dog => {
                return  `../../public/images/${dog}`
            })
            .filter(dogStr => {
                dogStr.includes('dog')
            })
            console.log('dogStr', dogStrs)
            res.render('index', dogStrs)
        });
    }
    // have images
    // send images to template
    // var str = `../../public/images/${dog}`
    // for (var i = 0; i < array.length; i++) {
    //     array[i]
    // }
    // }
}
