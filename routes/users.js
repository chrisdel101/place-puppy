var express = require('express');
var app = express()
var router = express.Router();
const usersController = require('../logic/controllers/users.controller')

router.get('/users', (req,res) => {
    console.log('hello')
} )
module.exports = router;
