require('dotenv').config()
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var formidable = require('formidable');
// const upload = require('express-fileupload')
const multer = require('multer')
var upload = multer({dest: 'uploads/'})
var flash = require('express-flash')
var session = require('express-session')
var helpers = require('./helpers')

const debug = require('debug')

const log = debug('app:log')
const error = debug('app:error')
// log.log = console.log.bind(console);
if(debug.enabled){
    console.log('true')
}
log('hello')
console.log(process.env.npm_package_name)
console.log(process.env.DEBUG)

error('error')
function date(){
    return Date.parse(new Date())

}
console.log('date', date())
// var randtoken = require('rand-token');
// console.log('log', log)
// console.log('error', error)
// //
//  Generate a 16 character alpha-numeric token:
// var token = randtoken.generate(32);
// console.log(token)


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// / MONGO
var mongoose = require('mongoose')
var mongoDB = process.env.DB_URI;

// console.log(mongoDB)
//
mongoose.connect(mongoDB)
// mongoose.connect("mongodb://<arssonist>:<eleven11>@ds121262.mlab.com:21262/placepuppy")

console.log('db connected')
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));
db.once('open', function() {
	// we're connected!
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.title = 'placepuppy'


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser('secret'));
app.use(session({
	maxAge: 60000, secret: process.env.SECRET,
	// store: db,  connect-mongo session store,
	resave: true,
	saveUninitialized: true

}));
app.use(flash());
// pass variables to our templates + all requests
app.use((req, res, next) => {
  res.locals.h = helpers;
  // res.locals.flashes = req.flash();
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
// app.use(upload())
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
// app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development'
		? err
		: {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
