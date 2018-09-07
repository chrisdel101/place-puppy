var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

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
            field_one_name: 'username',
            field_two_name: 'password',
            field_two_name: 'password-confrimation',
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
