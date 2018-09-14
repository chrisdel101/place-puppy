const User = require("../models/user.model.js")
// const multer = require('multer')
// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, '/uploads')
//     },
//     filename: function(req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + file.originalname)
//     }
// })
// const upload = multer({storage: storage})
const bcrypt = require('bcrypt')
const saltRounds = 10
// const AWS = require('aws-sdk')
// const uuid = require('uuid')
// const bucketName = `placepuppy/users`
// AWS.config.update({region: 'US EAST'})

module.exports = {
    comparePWs: (pw1, pw2) => {
        return (
            pw1 === pw2
            ? true
            : false)
    },
    register: (req, res) => {

        // check that user and pw not blank
        if (req.body.username.length === 0 || req.body.password.length === 0) {
            console.log('Username or password cannot be blank')
            req.flash('info', 'Username or password cannot be blank')
            res.redirect('register')
            return
        }

        console.log('body', req.body.password)
        console.log('body', req.body['password-confirmation'])
        // check that both passwords match
        let bool = module.exports.comparePWs(req.body.password, req.body['password-confirmation'])
        console.log('bool', bool)
        // if don't match, kill
        if (!bool) {
            console.log('passwords do not match')
            req.flash('info', 'passwords do not match')
            res.redirect('register')
            return
        }
        // get hash from pw
        bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            console.log('hash', hash)
            // add user name and hash
            let user = new User({username: req.body.username, password: hash})
            console.log('user', user)

            // lookup to see if username already exists
                User.find({
                    username: String(req.body.username).toLowerCase()
                }, (err, userArr) =>  {
                    if(err) console.error('An error in finding occured')
                    console.log('user', user)
                     // if user exists
                    if(userArr.length > 0){
                        console.log('That user already exists. Choose another name.')
                        req.flash('info', 'That user already exists. Choose another name.')
                         // redirect to same page
                        res.redirect('register')
                    } else {
                         // save user
                        let promise = user.save()
                        promise
                        .then(userData => {
                            console.log('user saved')
                            req.flash('success', 'User successfully saved.')
                            res.redirect('register')
                        })
                        .catch(err => {
                            console.log('an error occured', err)
                            req.flash('error', `An Error occurred in saving: ${err}`)
                            res.redirect('register')
                        })
                    }
        })
            return
        }).catch(err => {
            console.log("There was an err in hashing", err)
        })

    },
    registerDisplay: (req, res) => {
        console.log('register Displayfired')
        res.render('register', {
            method: 'POST',
            action: '/register',
            enctype: 'application/x-www-form-urlencoded',
            routeName: req.path,
            field_one_maxlength: '15',
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
