const session = require('express-session')
const User = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const saltRounds = 10
const cookieParser = require('cookie-parser')

module.exports = {
    login: (req, res) => {
        let username = req.body.username
        let password = req.body.password
        console.log('username', username)
        console.log('password', password)

        if (req.body.username.length === 0 || req.body.password.length === 0) {
            console.log('Username or password cannot be blank')
            req.flash('info', 'Username or password cannot be blank')
            res.redirect('register')
            return
        }
        // Look up username - get ID
        User.find({
            username: String(username)
        }, 'username', (err, userArr) => {
            if (err)
                console.error(err)
                // console.log(Array.isArray(userArr))
            console.log(`userArr`, userArr)
            if (!userArr) {
                console.log('No user. Breaking out of func.')
                return
            }
            if (userArr.length <= 0) {
                console.log('username does not exist')
                req.flash('info', 'Username does not exist')
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
                        res.redirect('add')
                    } else {
                        console.log('incorrect password')
                        // flash
                        req.flash('info', 'incorrect password')
                        res.redirect('login')
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
            field_one_for: 'username',
            field_two_for: 'password',
            field_one_obj: 'usurname',
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
                    if (!user) {
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function(err) {
                        done(err, token, user);
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
    }
}
