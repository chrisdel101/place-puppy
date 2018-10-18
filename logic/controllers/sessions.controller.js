const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const User = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const saltRounds = 10
const cookieParser = require('cookie-parser')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

module.exports = {
    login: (req, res) => {
        let email = req.body.email
        let password = req.body.password
        log('email', email)

        if (req.body.email.length === 0 || req.body.password.length === 0) {
            error('Email or password cannot be blank')
            req.flash('info', 'Email or password cannot be blank')
            return res.redirect('register')
        }
        // Look up email - get ID
        User.find({
            email: String(email)
        }, 'email', (err, userArr) => {
            if (err) {
                error('An error occured', err)
                req.flash('error', 'A database error occured')
                return res.redirect('login')
            }
            log(`userArr`, userArr)
            if (!userArr) {
                error('No user. Breaking out of func.')
                req.flash('error', 'An unknown error occured. Try reloading.')
                res.redirect('login')
            }
            if (userArr.length <= 0) {
                error('email does not exist')
                req.flash('info', 'Email does not exist')
                return res.redirect('login')
            }
            // make sure only one user by name
            if (userArr.length > 1) {
                error('Multiple users detected. Cannnot open')
                req.flash('error', 'There is an error with that username.')
                return res.redirect('login')
            }
            // Use ID to lookup hash for PW
            let id = userArr[0].id
            User.find({
                _id: id
            }, (err, arr) => {
                let obj = arr[0]
                bcrypt.compare(password, obj.password, function(err, response) {
                    if (response) {
                        // add user to session
                        req.session.user = obj
                        log('added to session')
                        log('user session', req.session.user)
                        req.flash('success', 'Login successfull')
                        return res.redirect('add')
                    } else {
                        error('incorrect password')
                        // flash
                        req.flash('info', 'incorrect password')
                        return res.redirect('login')
                    }
                })
            })
        })
    },
    loginDisplay: (req, res) => {
        console.log(req.session.user)
        return res.render('login', {
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
        log('user session', req.session.user)
        return res.render('logout', {
            method: 'POST',
            action: '/logout',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Sign Out"
        })
    },
    logout: (req, res) => {
        log('user session', req.session.user)
        req.session.destroy()
        return res.redirect('/')
    }
}
