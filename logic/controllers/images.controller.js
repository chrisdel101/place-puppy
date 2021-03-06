const path = require('path')
const mongoose = require('mongoose')
const Image = mongoose.models.Image || require('../models/image.model.js')
const url = require('url')
const sharp = require('sharp')
const cloudinary = require('cloudinary')
const {
  cloudinaryUploader,
  extractDims,
  sessionCheck,
  checkAllDigits,
} = require('../utils')
const https = require('https')
const streamTransform = require('stream').Transform
const Stream = require('stream')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
let closureCache

// quality and strFormat are querys - blank by default
function showImage(req, res, quality, strFormat) {
  var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  // get pathname from url
  let pathName = url.parse(fullUrl)
  // regex checks to see if starts w /
  let re = /^\//gi
  // get pathname from url
  pathName = pathName.pathname
  if (pathName.match(re)) {
    // slice out forward slash
    pathName = pathName.slice(1, pathName.length)
  }
  log('pathname', pathName)

  if (!checkAllDigits(pathName)) {
    error('The dims provide include non-numeric chars. Must be all digits.')
    throw Error('Non-numeric chars in the image dimensions.')
  }

  let dims = extractDims(pathName)
  //
  let width = parseInt(dims.width)
  let height = parseInt(dims.height)
  if (!width || !height) {
    error('width or height is null')
    throw TypeError('Width or height is null in showImage()')
  }
  // CACHE
  // if quality or format in string, skip the cache
  if (!quality && !strFormat) {
    // if in cache call from cache
    let currentCache = closureCache()
    if (getCache(currentCache, pathName)) {
      log('getCache', currentCache)
      let index = retreiveBufferIndex(pathName, currentCache)

      if (index < 0) {
        error('Error: Indexing of cache is less than zero. Illegal index.')
        throw TypeError(
          'Error: Indexing of cache is less than zero. Illegal index.'
        )
        return
      }
      // get by array index and key name
      let buffer = currentCache[index][pathName]
      // Initiate the source
      var bufferStream = new Stream.PassThrough()
      // Write your buffer
      bufferStream.end(new Buffer(buffer))
      log('Serving from : cache')
      // get format from imgObj
      let format = currentCache[index]['format']
      // resize
      return resize(bufferStream, width, height, format).pipe(res)
    }
  }
  let preSets = [
    '100x100',
    '150x150',
    '200x200',
    '250x250',
    '300x300',
    '350x350',
    '400x400',
    '450x450',
    '500x500',
    '550x550',
    '600x600',
    '650x650',
    '700x700',
  ]
  new Promise((resolve, reject) => {
    // if one of the preset images, send this
    if (preSets.includes(pathName)) {
      resolve(Image.findOne({ path: pathName }).exec())
    } else {
      // else random
      // https://stackoverflow.com/questions/39277670/how-to-find-random-record-in-mongoose
      // Get the count of all users
      Image.count().exec(function (err, count) {
        if (err) {
          error(err)
          req.flash('error', `A networking error occured: ${err}`)
          res.redirect('index', `A networking error occured. Try again.`)
        }
        // Get a random entry
        var random = Math.floor(Math.random() * count)
        resolve(Image.findOne().skip(random).exec())
      })
    }
  })
    .then((img) => {
      // check not null
      if (!img) {
        error('This data does not exist')
        throw ReferenceError(
          'Error. Data does not exist. Try reloading and check URL for errors.'
        )
      }
      log('img', img)
      // make sure img has prop type
      let format = imageFormat(img.contentType)
      // if no contentType, error
      if (!format) {
        throw TypeError('Invalid format. Must be jpg, jpeg, png, or gif.')
      }
      // if format change in query, change img type
      if (strFormat) {
        let newSrc = replaceUrlExt(img.src, strFormat)
        img.src = newSrc
        log('Foramting changed in Url. New format src:', img.src)
      }
      // get qualiy and set new str
      if (quality) {
        let newSrc = setImageQuality(img.src, quality)
        img.src = newSrc
        log('Quality src', img.src)
      }
      // set type
      res.type(`image/${format || 'jpg'}`)
      // call url from cloudinary
      httpCall(img.src, pathName)
        .then((array) => {
          // val one is stream2
          let stream = array[0]
          // val 2 is cache
          let cache = array[1]
          // pass to resize func and pipe to res
          ///// strFormat needs to be added after debug
          return resize(stream, width, height, format).pipe(res)
        })
        .catch((err) => {
          error('An error in the promise ending show', err)
          res.status(404).send(err)
        })
    })
    .catch((err) => {
      error('An error in the promise ending show', err)
      res.status(404).send(err)
    })
}
// makes http get, returns stream in promise - takes src and pathname
function httpCall(src, pathname) {
  return new Promise((resolve, reject) => {
    let format = imageFormat(src)
    https.get(src, (response) => {
      if (response.statusCode === 200) {
        log('status of url call', response.statusCode)
        log('called made to', src)
        var data = new streamTransform()

        response.on('data', (chunk) => {
          data.push(chunk)
        })
        response.on('end', () => {
          // read data with.read()
          data = data.read()
          // push to cache
          //stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
          // Initiate the source
          https: var bufferStream = new Stream.PassThrough()

          // Write your buffer
          bufferStream.end(new Buffer(data))
          // CACHE- add and remove from cache
          let result = closureCache(pathname, data, format)
          log('serving from: cloud')
          // add and remove from cache
          resolve([bufferStream, result])
        })
      } else {
        error(`An http error occured`, response.statusCode)
        reject('promise in http.get rejected')
      }
    })
  })
}
// returns an object - stream piped to res
function resize(stream, width, height, format) {
  if (typeof width !== 'number' || typeof height !== 'number') {
    error('resize error: Width or height must be of type number.')
    throw TypeError('resize error: Width or height must be of type number.')
  }
  if (!imageFormat(format)) {
    error('resize error: Invalid format. Must be jpg, jpeg, png, or gif.')
    throw TypeError(
      'resize error: Invalid format. Must be jpg, jpeg, png, or gif.'
    )
  }
  var transformer = sharp()
    .resize(width, height)
    .on('info', function (info) {
      log('Resize: okay')
    })
  return stream.pipe(transformer)
}
function setImageQuality(urlStr, quality) {
  if (typeof urlStr !== 'string' || typeof quality !== 'string') {
    error('setImageQuality error: functions params must both be strings')
    throw TypeError(
      'setImageQuality error: functions params must both be strings'
    )
  }
  if (
    quality !== 'high' &&
    quality !== 'good' &&
    quality !== 'eco' &&
    quality !== 'low'
  ) {
    error(
      'setImageQuality: quality setting is invalid. Must be high, good, eco, or low'
    )
    throw TypeError(
      'setImageQuality: quality setting is invalid. Must be high, good, eco, or low'
    )
  }
  // this should take 'upload'
  let beforeRegex = /(.+)upload/
  // pin on quality to start of string
  let afterRegex = /upload(.+)/

  let before = urlStr.match(beforeRegex)[0]
  let after = urlStr.match(afterRegex)[1]

  let insertStr = ``
  switch (quality) {
    case 'high':
      insertStr = `q_auto:best`
      break
    case 'good':
      insertStr = `q_auto:good`
      break
    case 'eco':
      insertStr = `q_auto:eco`
      break
    case 'low':
      insertStr = `q_auto:low`
      break
    default:
      insertStr = 'q_auto'
  }
  return `${before}/${insertStr}${after}`
}

function imageFormat(imgSrc) {
  // convert to lower
  if (typeof imgSrc === 'string') {
    imgSrc = imgSrc.toLowerCase()
  } else {
    error('imageFormat error: imgSrc must be a string')
    throw TypeError('imageFormat error: imgSrc must be a string')
  }

  if (imgSrc.includes('jpeg') || imgSrc.includes('jpg')) {
    return 'jpg'
  } else if (imgSrc.includes('png')) {
    return 'png'
  } else if (imgSrc.includes('gif')) {
    return 'gif'
  } else {
    return false
  }
}
function replaceUrlExt(imgUrl, newExt) {
  if (
    newExt !== 'jpg' &&
    newExt !== 'png' &&
    newExt !== 'gif' &&
    newExt !== 'jpeg'
  ) {
    error('Extension is not valid to replace url. Only png, jpg, and gif.')
    throw new TypeError(
      'Extension is not valid to replace url. Only png, jpg, and gif.'
    )
  }
  if (
    !imgUrl.includes('jpg') &&
    !imgUrl.includes('png') &&
    !imgUrl.includes('gif') &&
    !imgUrl.includes('jpeg')
  ) {
    error('Url is not has not extension. Must be jpg, png, or gif.')
    throw TypeError('Url is not has not extension. Must be jpg, png, or gif.')
  }
  let fileNoExt = imgUrl.split('.').slice(0, -1).join('.')
  return `${fileNoExt}.${newExt}`
}
// to call cache, call func without args
// stores imgs cache in a closure
closureCache = (function () {
  let imgs = []
  return function (pathname, buffer, format) {
    // getter
    if (arguments.length <= 0) {
      return imgs
    }
    // setter
    let imgObj = {}
    imgObj[pathname] = buffer
    // add format to obj
    imgObj['format'] = format
    // console.log('imgObj', imgObj)
    imgs.push(imgObj)
    // if more than 4, shift one off
    if (imgs.length > 4) {
      imgs.shift()
      log('shifting off cache array')
    }
    // if this is called, image is coming from cloud
    return imgs
  }
})()

// checks if pathname is inside the cache
// take arr of objects with path/buffer key vals, + pathname
function getCache(arr, pathname) {
  if (!Array.isArray(arr)) {
    throw TypeError('First input of getCache must be an array.')
  }
  if (typeof pathname !== 'string') {
    throw TypeError('Second input of getCache must be a string.')
  }
  // make arr of only keys
  let paths = arr.map((key) => {
    // arr of string buffer pairs
    return Object.keys(key)[0]
  })
  return paths.includes(pathname)
}
// get buffer from array of caches - '100x100', cache
function retreiveBufferIndex(pathname, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (Object.keys(arr[i])[0] === pathname) return arr.indexOf(arr[i])
  }
  return -1
}

module.exports = {
  resize: resize,
  imageFormat: imageFormat,
  showImage: showImage,
  setImageQuality: setImageQuality,
  replaceUrlExt: replaceUrlExt,
  httpCall: httpCall,
  getCache: getCache,
  retreiveBufferIndex: retreiveBufferIndex,
  closureCache: closureCache,
}
