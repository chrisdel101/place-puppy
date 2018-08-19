const Image = require('../models/images.model.js')
const db = process.env.DB_URI

// console.log(Image)
module.exports = {
    addImmage: (req,res) => {
        console.log('add image')
        return
    },
    addFile: (req,res) => {
        var dog = {
            color:'white',
            fluffy: true
        }
        let myImage = new Image({
            photographer: 'no photographer',
            title: 'no title',
            location_taken: 'no location_taken',
            tags:[]
        })

        myImage.save(function(err, image){
            if(err) return console.error(err)
            console.log('saved')
        })
        res.render('add', {
            title: 'title',
            title_of_work:'Title of work',
            photographer: 'photographer',
            photographers_name: "Photographer's name",
            image_description: 'description',
            describe_image: 'Describe Image'
        })
    }
}
