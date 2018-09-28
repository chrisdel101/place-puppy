const User = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const saltRounds = 10
const async = require("async")
const crypto = require('crypto')



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
            res.redirect('register')
            return
        }
        // check that both emails match
        // if don't match, kill
        if(!module.exports.compareStrs(req.body.email, req.body['email-confirmation'])){
            console.log('emails do not match')
            req.flash('info', 'emails do not match')
            res.redirect('register')
            return
        }
        console.log('pw1', req.body.password)
        console.log('pw2', req.body['password-confirmation'])
        // check that both passwords match
        if (!   module.exports.compareStrs(req.body.password, req.body['password-confirmation'])) {
            console.log('passwords do not match')
            req.flash('info', 'passwords do not match')
            res.redirect('register')
            return
        }
        // get hash from pw
        bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            console.log('hash', hash)
            // add user name and hash
            let user = new User({email: req.body.email, password: hash})
            console.log('user', user)

            // lookup to see if username already exists
            User.find({
                username: String(req.body.username).toLowerCase()
            }, (err, userArr) => {
                if (err)
                    console.error('An error in finding occured')
                console.log('user', user)
                // if user exists
                if (userArr.length > 0) {
                    console.log('That user already exists. Choose another name.')
                    req.flash('info', 'That user already exists. Choose another name.')
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
            field_one_maxlength: '15',
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
                    console.log('email', req.body.email)
                    if (!user) {
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function(err) {
                        done(err, token, user);
                        console.log('user token saved')
                    });
                });
            },
            function(token, user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'learntocodeinfo@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'learntocodeinfo@gmail.com',
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
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('reset', {token: req.params.token});
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
                    if (req.body.password === req.body.confirm) {
                        user.setPassword(req.body.password, function(err) {
                            user.resetPasswordToken = undefined;
                            user.resetPasswordExpires = undefined;

                            user.save(function(err) {
                                req.logIn(user, function(err) {
                                    done(err, user);
                                });
                            });
                        })
                    } else {
                        req.flash("error", "Passwords do not match.");
                        return res.redirect('back');
                    }
                });
            },
            function(user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'learntocodeinfo@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'learntocodeinfo@mail.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' + 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/campgrounds');
        });
    },
    // forgot password
    forgotPasswordView: (req, res) => {
        return res.render('reset', {
            method: 'POST',
            action: '/forgot',
            enctype: 'application/x-www-form-urlencoded',
            // route name is used in template
            routeName: req.path,
            field_one_for: 'username',
            field_two_for: 'password',
            field_one_id: 'usurname',
            field_two_id: 'password',
            field_one_type: 'text',
            field_two_type: 'password',
            field_one_name: 'username',
            field_two_name: 'password',
            fieldOne: 'Username',
            fieldTwo: 'Password',
            field_one_placeholder: 'Enter Username',
            field_two_placeholder: 'Enter Password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Reset"
        })
    },
}
