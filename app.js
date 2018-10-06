require('dotenv').config()
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const flash = require('express-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);


const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

log('ENV', process.env.NODE_ENV)

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// / MONGO
var mongoose = require('mongoose')
var mongoDB = process.env.DB_URI;//
mongoose.connect(mongoDB)

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));
log('db connected')
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
	maxAge: 60000,
    secret: process.env.SECRET,
	store: new MongoStore({ mongooseConnection: db}),
	resave: true,
	saveUninitialized: true

}));

app.use(flash());


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
