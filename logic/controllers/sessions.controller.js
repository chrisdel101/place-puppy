module.exports = {
    loginDisplay: (req, res) => {
        res.render('login', {
            routeName: req.path,
            field_one_for: 'username',
            field_two_for: 'password',
            field_one_id: 'usurname',
            field_two_id: 'password',
            field_one_type: 'text',
            field_two_type: 'password',
            fieldOne: 'Username',
            fieldTwo: 'Password',
            field_one_placeholder: 'Enter Username',
            field_two_placeholder: 'Enter Password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: "Sign In"
           })
    },
    registerDisplay: (req, res) => {
        res.render('register', {
            routeName: req.path,
            fieldOne: 'Create a username',
            fieldTwo: 'Create a password',
            fieldThree: 'Re-enter the password',
            field_one_for: 'username',
            field_two_for: 'password',
            field_three_for: 'password-confrimation',
            field_one_id: 'username',
            field_two_id: 'password',
            field_one_type: 'text',
            field_two_type: 'password',
            field_three_type: 'password',
            field_three_id: 'password-confrimation',
            field_one_placeholder: 'Enter username',
            field_two_placeholder: 'Enter password',
            field_three_placeholder: 'Re-enter password',
            button_type: 'submit',
            button_value: 'submit',
            buttonField: 'Register'
        })

    }
}
