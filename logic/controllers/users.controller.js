const User = require("../models/user.model.js")

module.exports = {
    createNewUser: (req, res) => {
        console.log('req', req.body)
        let user = new User({
            username: 'hello',
            password: 'hello'
        })
        console.log('user', user)
        res.redirect('register')
    },
     registerDisplay: (req, res) => {
         console.log('fired')
        res.render('register', {
            method: 'POST',
            action: '/register',
            enctype: 'multipart/form-data',
            routeName: req.path,
            fieldOne: 'Create a username',
            fieldTwo: 'Create a password',
            fieldThree: 'Re-enter the password',
            // field_one_for: 'username',
            // field_two_for: 'password',
            // field_three_for: 'password-confrimation',
            // field_one_id: 'username',
            // field_two_id: 'password',
            // field_three_id: 'password-confirmation',
            // field_one_type: 'text',
            // field_two_type: 'password',
            // field_three_type: 'password',
            // field_one_name: 'x',
            // field_two_name: 'y',
            // field_three_name: 'z',
            // field_one_placeholder: 'Enter username',
            // field_two_placeholder: 'Enter password',
            // field_three_placeholder: 'Re-enter password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: 'Register'
        })
    }
}
