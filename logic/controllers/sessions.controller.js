var session = require('express-session')
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

// var mongoDB = process.env.DB_URI
// var db = mongoose.connection;
// db.once('open', function() {
//   // we're connected!
// });

// console.log(db.createNewUser())

module.exports = {
    login: (req, res) => {
        let username = req.body.username
        let password = req.body.password
        console.log('username', username)
        console.log('password', password)
        User.find({
            username: String(username)
        }, 'username',
        (err, user) => {
            if(err) console.error(err)
            // console.log(Array.isArray(user))
            console.log(`user`, user)
            let id = user[0].id
            User.find({
                _id: id
            }, (err, arr) => {
                // console.log(arr)
            // if username does not exist
            if(arr.length <= 0){
                console.log('username does not exist')
            } else {
                // make sure only one user by name
                if(arr.length > 1){
                    console.error('Multiple users detected. Cannnot open')
                } else {
                    let obj = arr[0]
                    console.log(password)
                    console.log(obj.password)
                    bcrypt.compare(password, obj.password, function(err, res) {
                        console.log('res', res)
                    });
                }
            }

        })
    })
        res.redirect('login')
    },
    loginDisplay: (req, res) => {
        res.render('login', {
            method: 'POST',
            action:'/login',
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
    }
}
