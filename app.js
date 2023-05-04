require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const winston = require('winston')
const expressWinston = require('express-winston')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const ENV =
process.env?.NODE_ENV === 'development' ? 'development' : ' production'

const index = require('./routes/index')
const helmet = require("helmet");
const app = express()
const maintenance = process.env.MAINTENANCE


app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }));
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.set('trust proxy', 'loopback')

app.locals = {
  title: 'placepuppy',
  ENV,
  maintenance
}

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser(''))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)

app.use(
  expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
  })
)
// // catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('404 Not Found')
  err.status = 404
  next(err)
})

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  {
    flags: 'a',
  }
)

// express-winston errorLogger makes sense AFTER the router.
app.use(
  expressWinston.errorLogger({
    transports: [
      new winston.transports.File({
        filename: 'error.log',
        level: 'error',
      }),
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
  })
)
const errorController = require('./logic/controllers/error.controller')
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  // render the error page
  errorController.showErrorPage(req, res, err)
})

exports.app = app
exports.ENV = ENV
