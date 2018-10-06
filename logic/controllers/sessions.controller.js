const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

const User = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const saltRounds = 10
const cookieParser = require('cookie-parser')

module.exports = {
    login: (req, res) => {
        let email = req.body.email
        let password = req.body.password
        console.log('email', email)
        console.log('password', password)

        if (req.body.email.length === 0 || req.body.password.length === 0) {
            console.log('Email or password cannot be blank')
            req.flash('info', 'Email or password cannot be blank')
            res.redirect('register')
            return
        }
        // Look up email - get ID
        User.find({
            email: String(email)
        }, 'email', (err, userArr) => {
            if (err)
                console.error(err)
                // console.log(Array.isArray(userArr))
            console.log(`userArr`, userArr)
            if (!userArr) {
                console.log('No user. Breaking out of func.')
                return
            }
            if (userArr.length <= 0) {
                console.log('email does not exist')
                req.flash('info', 'Email does not exist')
                res.redirect('login')
                return
            }
            // make sure only one user by name
            if (userArr.length > 1) {
                console.error('Multiple users detected. Cannnot open')
                req.flash('error', 'A error occured')
                res.redirect('login')
            }
            // Use ID to lookup hash for PW
            let id = userArr[0].id
            User.find({
                _id: id
            }, (err, arr) => {
                let obj = arr[0]
                console.log(password)
                console.log(obj.password)
                bcrypt.compare(password, obj.password, function(err, response) {
                    if (response) {
                        // console.log('res', response)
                        // add user to session
                        req.session.user = obj
                        // console.log(req.session.user)
                        console.log('added to session')
                        req.flash('success', 'Login successfull')
                        return res.redirect('add')
                    } else {
                        console.log('incorrect password')
                        // flash
                        req.flash('info', 'incorrect password')
                        return res.redirect('login')
                    }
                })
            })
        })
    },
    loginDisplay: (req, res) => {
        res.render('login', {
            method: 'POST',
            action: '/login',
            enctype: 'application/x-www-form-urlencoded',
            // route name is used in template
            routeName: req.path,
            field_one_for: 'email',
            field_two_for: 'password',
            field_one_obj: 'email',
            field_two_id: 'password',
            field_one_type: 'text',
            field_two_type: 'password',
            field_one_name: 'email',
            field_two_name: 'password',
            fieldOne: 'Email',
            fieldTwo: 'Password',
            field_one_placeholder: 'Enter Email',
            field_two_placeholder: 'Enter Password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Sign In"
        })
    },
    logoutDisplay: (req, res) => {
        console.log(req.session.user)
        res.render('logout', {
            method: 'POST',
            action: '/logout',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Sign Out"
        })
    },
    logout: (req, res) => {
        console.log(req.session.user)
        req.session.destroy()
        res.redirect('/')
    }
}
