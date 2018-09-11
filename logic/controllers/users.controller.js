const User = require("../models/user.model.js")
var multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
})
var upload = multer({ storage: storage})

var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';


module.exports = {
    //     hashPassword: (password) => {
    //         let outerHash = ''
    //         bcrypt.hash(password, saltRounds)
    //         .then(function(hash) {
    //             outerHash = hash
    //             console.log('outerHash', outerHash)
    //             return outerHash
    //         });
    // },
    createNewUser: (req, res) => {
        // get hash from pw
        bcrypt.hash(req.body.password, saltRounds)
        .then(function(hash) {
            console.log('hash', hash)
            // add user name and hash
            let user = new User({
                username: req.body.username,
                password: hash
            })
            // lookup to see if username already exists
            User.find({
                username: String(req.body.username).toLowerCase()
            }, (err, userArr) =>  {
                if(err) console.error('An error in finding occured')
                console.log('user', user)
                // if user exists
                if(userArr.length > 0){
                    console.log('That user already exists')
                    // flash
                } else {
                    // save user
                    // flash
                    let promise = user.save()
                    promise
                    .then(userData => {
                        console.log('user saved')
                    })
                    .catch(err => {
                        console.log('an error occured', err)
                    })
                }
            })
            // redirect to same page
            res.redirect('register')
        }).catch(err => {
            console.log("There was an err in hashing", err)
        })

    },
     registerDisplay: (req, res) => {
         console.log('register Displayfired')
        res.render('register', {
            method: 'POST',
            action: '/register',
            enctype: 'multipart/form-data',
            routeName: req.path,
            fieldOne: 'Create a username',
            fieldTwo: 'Create a password',
            fieldThree: 'Re-enter the password',
            field_one_for: 'username',
            field_two_for: 'password',
            field_three_for: 'password-confrimation',
            field_one_id: 'username',
            field_two_id: 'password',
            field_three_id: 'password-confirmation',
            field_one_type: 'text',
            field_two_type: 'password',
            field_three_type: 'password',
            field_one_name: 'username',
            field_two_name: 'password',
            field_three_name: 'password-confirmation',
            field_one_placeholder: 'Enter username',
            field_two_placeholder: 'Enter password',
            field_three_placeholder: 'Re-enter password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: 'Register'
        })
    }
}
