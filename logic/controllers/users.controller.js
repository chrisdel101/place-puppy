const User = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const saltRounds = 10
const async = require("async")
const crypto = require('crypto')
const nodemailer = require('nodemailer')

module.exports = {
    compareStrs: (pw1, pw2) => {
        return (
            pw1 === pw2
            ? true
            : false)
    },
    register: (req, res) => {

        // check that user and pw not blank
        if (req.body.email.length === 0 || req.body.password.length === 0) {
            console.log('Email or password cannot be blank')
            req.flash('info', 'Username or password cannot be blank')
            return res.redirect('register')
        }
        // check that both emails match
        // if don't match, kill
        if (!module.exports.compareStrs(req.body.email, req.body['email-confirmation'])) {
            console.log('emails do not match')
            req.flash('info', 'emails do not match')
            return res.redirect('register')
        }
            console.log('pw1', req.body.password)
            console.log('pw2', req.body['password-confirmation'])
        // check that both passwords match
        if (!module.exports.compareStrs(req.body.password, req.body['password-confirmation'])) {
            console.log('passwords do not match')
            req.flash('info', 'passwords do not match')
            res.redirect('register')
            return
        }
        if(!module.exports.passwordVerify(req.body.password)){
            console.log('Password too short. Must be at least 8 characters')
            req.flash('info','Password is too short. Must be at least eight characters.')
            return res.redirect('register')
        }
        // get hash from pw
        bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            console.log('hash', hash)
            // add user name and hash
            let user = new User({email: req.body.email, password: hash})
            console.log('user', user)

            // lookup to see if username already exists
            User.find({
                username: String(req.body.email).toLowerCase()
            }, (err, userArr) => {
                if (err)
                    console.error('An error in finding occured')
                console.log('user', user)
                // if user exists
                if (userArr.length > 0) {
                    console.log('That email already exists. Register with another')
                    req.flash('info', 'That email already exists. Register with another.')
                    // redirect to same page
                    res.redirect('register')
                } else {
                    // save user
                    let promise = user.save()
                    promise.then(userData => {
                        console.log('user saved')
                        req.flash('success', 'User successfully saved.')
                        res.redirect('register')
                    }).catch(err => {
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
            fieldOne: 'Enter an Email as Your Username',
            fieldTwo: 'Re-enter Your Email Username',
            fieldThree: 'Create a password',
            fieldFour: 'Re-enter the password',
            field_one_for: 'email',
            field_two_for: 'email-confirmation',
            field_three_for: 'password',
            field_four_for: 'password-confirmation',
            field_one_id: 'email',
            field_two_id: 'email-confirmation',
            field_three_id: 'password',
            field_four_id: 'password-confirmation',
            field_one_type: 'email',
            field_two_type: 'email',
            field_three_type: 'password',
            field_four_type: 'password',
            field_one_name: 'email',
            field_two_name: 'email-confirmation',
            field_three_name: 'password',
            field_four_name: 'password-confirmation',
            field_one_placeholder: 'Enter email',
            field_two_placeholder: 'Re-enter email',
            field_three_placeholder: 'Enter password',
            field_four_placeholder: 'Re-enter password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: 'Register'
        })
    },
    forgotPassword: (req, res, next) => {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({
                    email: req.body.email
                }, function(err, user) {
                    if(err) console.error(err)
                    console.log('email', req.body.email)
                    if (!user) {
                        console.log('No user with that email')
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function(err) {
                        if (err)
                            console.error('An error occured in saving')
                        done(err, token, user);
                        console.log('user token saved')
                        console.log('USER', user)
                    });
                });
            },
            function(token, user, done) {
                var smtpTransport = nodemailer.createTransport({
                    host: process.env.MAIL_SERVER,
                    auth: {
                        user: process.env.MAIL_USERNAME,
                        pass: process.env.MAIL_PASSWORD
                    }
                });
                var mailOptions = {
                    to: req.body.email,
                    from: 'chris@place-puppy.com',
                    subject: 'Node.js Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 'http://' + req.headers.host + '/reset/' + token + '\n\n' + 'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err)
                return next(err);
            res.redirect('/forgot');
        });
    },
    pwTokenGet: (req, res) => {
        User.findOne({
            resetPasswordToken: req.params.token,
            // resetPasswordExpires: {
            //     $gt: Date.now()
            // }
        }, function(err, user) {
            console.log('USER', user)
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('reset', {
                method: 'POST',
                // use token in route
                action: `/reset/${req.params.token}`,
                enctype: 'application/x-www-form-urlencoded',
                // route name is used in template
                routeName: req.path,
                field_one_for: 'password',
                field_two_for: 'password-confirmation',
                field_one_id: 'password',
                field_two_id: 'password-confirmation',
                field_one_type: 'password',
                field_two_type: 'password',
                field_one_name: 'password',
                field_two_name: 'password-confirmation',
                fieldOne: 'Enter New Password',
                fieldTwo: 'Re-enter New Password',
                field_one_placeholder: 'enter password',
                field_two_placeholder: 're-enter password',
                button_type: 'submit',
                button_value: 'submit',
                buttonField: "Reset"

            });
        });
    },
    pwTokenPost: (req, res) => {
        async.waterfall([
            function(done) {
                User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: {
                        $gt: Date.now()
                    }
                }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }
                    if (req.body.password !== req.body['password-confirmation']) {
                        req.flash("error", "Passwords do not match.");
                        return res.redirect('back');
                    }
                    if(!module.exports.passwordVerify){
                        req.flash('info', 'Password is too short. Must be at least eight characters.')
                    }
                    // create hash from pw
                    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                        console.log('hash', hash)
                        // save new hash
                        user.password = hash
                        // empty reset data
                        user.resetPasswordToken = null
                        user.resetPasswordExpires = null
                        //TODO- add PW checking function
                        let promise = user.save()
                        promise.then(userData => {
                            console.log('user saved')
                            req.flash('success', 'Password changed.')
                            res.redirect('/')
                        }).catch(err => {
                            console.log('an error occured', err)
                            req.flash('error', `An Error occurred in saving: ${err}`)
                            res.redirect('/forgot')
                        })

                    }).catch(err => {
                        console.log("There was an err in hashing", err)
                    })
                });
            },
            function(user, done) {
                var smtpTransport = nodemailer.createTransport({
                    host: process.env.MAIL_SERVER,
                    auth: {
                        user: process.env.MAIL_USERNAME,
                        pass: process.env.MAIL_PASSWORD
                    }
                });
                var mailOptions = {
                    to: req.body.email,
                    from: 'chris@place-puppy.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' + 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            console.error('a waterfall error occured');
            res.redirect('/forgot');
        });
    },
    passwordVerify: (pw) => {

        if(typeof pw !== 'string'){
            console.error('error: password must be a string')
            return false
        }
        if(pw.length < 8){
            console.log('Password too short. Must be 8 characters.')
            return false
        }
        return true

    },
    // forgot password view page
    forgotPasswordView: (req, res) => {
        return res.render('forgot', {
            method: 'POST',
            action: '/forgot',
            enctype: 'application/x-www-form-urlencoded',
            // route name is used in template
            routeName: req.path,
            field_one_for: 'email',
            field_one_id: 'email',
            field_one_type: 'text',
            field_one_name: 'email',
            fieldOne: 'Enter Email',
            field_one_placeholder: 'Enter email',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Reset"
        })
    }
}
