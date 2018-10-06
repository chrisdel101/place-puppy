const User = require('../models/user.model.js')
const bcrypt = require('bcrypt')
const saltRounds = 10
const async = require('async')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const debug = require('debug')
const log = debug('users:log')
const error = debug('users:error')


module.exports = {
    // compare two string
    compareStrs: (pw1, pw2) => {
        return (
            pw1 === pw2
            ? true
            : false)
    },
    // handle post register request
    register: (req, res) => {
        // check that user and pw not blank
        if (req.body.email.length === 0 || req.body.password.length === 0) {
            error('Email or password cannot be blank')
            req.flash('info', 'Username or password cannot be blank')
            return res.redirect('register')
        }
        // check that both emails match
        // if don't match, kill
        if (!module.exports.compareStrs(req.body.email, req.body['email-confirmation'])) {
            error('emails do not match')
            req.flash('info', 'emails do not match')
            return res.redirect('register')
        }
        // check that both passwords match
        if (!module.exports.compareStrs(req.body.password, req.body['password-confirmation'])) {
            error('passwords do not match')
            req.flash('info', 'passwords do not match')
            return res.redirect('register')
        }
        if(!module.exports.passwordVerify(req.body.password)){
            error('Password too short. Must be at least 8 characters')
            req.flash('info','Password is too short. Must be at least eight characters.')
            return res.redirect('register')
        }
        // get hash from pw
        bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            log('hash', hash)
            // add user name and hash
            let user = new User({email: req.body.email, password: hash})
            log('user', user)
            // lookup to see if username already exists
            User.find({
                username: String(req.body.email).toLowerCase()
            }, (err, userArr) => {
                if (err) {
                    error('An error in finding occured.')
                    res.flash('error', 'An database error occured. Try again.')
                    return res.redirect('register')
            }
                log('user', user)
                // if user exists
                if (userArr.length > 0) {
                    log('That email already exists. Register with another')
                    req.flash('info', 'That email already exists. Register with another.')
                    // redirect to same page
                    return res.redirect('register')
                } else {
                    // save user
                    let promise = user.save()
                    promise.then(userData => {
                        log('user saved')
                        req.flash('success', 'User successfully saved.')
                        return res.redirect('register')
                    }).catch(err => {
                        error('an error occured', err)
                        req.flash('error', `An Error occurred in saving: ${err}`)
                        return res.redirect('register')
                    })
                }
            })
        }).catch(err => {
            error('There was an err in hashing', err)
        })

    },
    // render register template
    registerDisplay: (req, res) => {
        return res.render('register', {
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
    // send user reset email
    forgotPassword: (req, res, next) => {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    log(`token created: ${token}`)
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({
                    email: req.body.email
                }, function(err, user) {
                    if(err) error(err)
                    log('email: ', req.body.email)
                    if (!user) {
                        error('No user with that email')
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function(err) {
                        if (err) error('An error occured in saving')
                        done(err, token, user);
                        log('user token saved')
                        log('USER', user)
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
                    log('mail sent');
                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err)
            next(err);
            return res.redirect('forgot');
        });
    },
    // display user reset form
    pwTokenGet: (req, res) => {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            log('USER', user)
            if (!user) {
                error('Password reset token is invalid or has expired. Or a networking error occured.')
                req.flash('error', 'Password reset token is invalid or has expired. Or a networking error occured.');
                return res.redirect('forgot');
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
                buttonField: 'Reset'

            });
        });
    },
    // post user PW reset
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
                        error('Password reset token is invalid or has expired.')
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }
                    if (req.body.password !== req.body['password-confirmation']) {
                        req.flash('error', 'Passwords do not match.');
                        return res.redirect('back');
                    }
                    if(!module.exports.passwordVerify){
                        error('Password is too short. Must be at least eight characters.')
                        req.flash('info', 'Password is too short. Must be at least eight characters.')
                        return res.redirect('back');
                    }
                    // create hash from pw
                    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                        log('hash', hash)
                        // save new hash
                        user.password = hash
                        // empty reset data
                        user.resetPasswordToken = null
                        user.resetPasswordExpires = null
                        let promise = user.save()
                        promise.then(userData => {
                            log('user saved')
                            req.flash('success', 'Password changed.')
                            res.redirect('/')
                        }).catch(err => {
                            error('an error occured', err)
                            req.flash('error', `An Error occurred in saving: ${err}`)
                            res.redirect('forgot')
                        })

                    }).catch(err => {
                        error('There was an err in hashing', err)
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
                    log('Password changed')
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            error('a waterfall error occured');
            res.flash('error', 'And error occured during reset.')
            res.redirect('forgot');
        });
    },
    // check password length
    passwordVerify: (pw) => {
        if(typeof pw !== 'string'){
            error('verify: fire must be a string block')
            return false
        }
        if(pw.length < 8){
            error('verify: fire too short block')
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
            buttonField: 'Reset'
        })
    }
}
