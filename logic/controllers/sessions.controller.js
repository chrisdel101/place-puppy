module.exports = {
    loginDisplay: (req, res) => {
        res.render('login', {
               username: 'username',
               password:'password',
               username_placeholder: 'Username',
               password_placeholder: 'Password',
               fieldOne: 'Username',
               fieldTwo: 'Password'

           })
    },
    registerDisplay: (req, res) => {
        console.log(res)
        res.render('register', {
            fieldOne: 'Create a username',
            fieldTwo: 'Create a password',
            fieldThree: 'Re-enter the password',
            username: 'username',
            password: 'password',
            username_placeholder: 'Enter username',
            password_placeholder: 'Enter password',
            password_placeholder2: 'Re-enter password',
            routeName: req.path
        })

    }
}
