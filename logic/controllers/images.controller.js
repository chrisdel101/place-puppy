const url = require('url')
const sharp = require('sharp')
const { extractDims, checkAllDigits } = require('../utils')
const images = require('../../images.json')
const https = require('https')
const streamTransform = require('stream').Transform
const Stream = require('stream')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const errorController = require('./error.controller')
const { call } = require('body-parser')
let closureCache
let currentUserIp

// quality and strFormat are querys - blank by default
function showImage(req, res, quality, strFormat) {
  try {
    if (quality) log('Quality', quality)
    if (strFormat) log('Format', strFormat)

    var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    // get pathname from url
    let pathName = url.parse(fullUrl)
    // regex checks to see if starts w /
    let re = /^\//gi
    // get pathname from url
    pathName = pathName.pathname
    log('pathName', pathName)

    if (pathName.match(re)) {
      // slice out forward slash
      pathName = pathName.slice(1, pathName.length)
    }

    const dims = extractDims(pathName)
    const width = parseInt(dims.width)
    const height = parseInt(dims.height)

    // CACHE
    // if quality or format in string, skip the cache
    // if user IP same as prev call, use cache
    if (!quality && !strFormat) {
      if (req?.ip !== currentUserIp) {
        closureCache({ reset: true })
      }
      // if in cache call from cache
      let currentCache = closureCache()
      if (getCache(currentCache, pathName)) {
        log('getCache', currentCache)
        let index = retreiveBufferIndex(pathName, currentCache)
        if (index < 0) {
          error(
            'Error: Indexing of cache is less than zero. Illegal index. Skipping cache'
          )
        } else {
          // get by array index and key name
          let buffer = currentCache[index][pathName]
          // Initiate the source
          var bufferStream = new Stream.PassThrough()
          // Write your buffer
          bufferStream.end(new Buffer.from(buffer))
          log('Serving from : cache')
          // get format from imgObj
          let format = currentCache[index]['format']
          // store user IP
          currentUserIp = req?.ip
          // resize
          return resize(bufferStream, width, height, format).pipe(res)
        }
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
    let img = {}
    // if one of the preset images, send this
    if (preSets.includes(pathName)) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].path === pathName) {
          img = { ...images[i] }
          break
        }
      }
    } else {
      // get one at random
      img = images[Math.floor(Math.random() * 20)]
    }

    let format = imageFormat(img.contentType)
    // if no contentType, error
    if (!format) {
      throw TypeError('Invalid format. Must be jpg, jpeg, png, or gif.')
    }
    // if format change in query, change img type
    if (strFormat) {
      let newSrc = replaceUrlExt(img.src, strFormat)
      img.src = newSrc
    }
    // get qualiy and set new str
    if (quality) {
      let newSrc = setImageQuality(img.src, quality)
      img.src = newSrc
    }
    // set type
    res.type(`image/${format || 'jpg'}`)
    httpCall(img.src, pathName)
      .then((transform) => {
        // read data with.read()
        const parsedBuffer = transform.read()
        //stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
        // Initiate the source
        // CACHE- add and remove from cache
        closureCache({ pathname: pathName, buffer: parsedBuffer })
        https: var stream = new Stream.PassThrough()
        // Write your buffer
        stream.end(new Buffer.from(parsedBuffer))
        // store user IP
        currentUserIp = req?.ip
        ///// strFormat needs to be added after debug
        return resize(stream, width, height, format).pipe(res)
      })
      .catch((err) => {
        error('An error in the promise ending show', err)
        res.status(404).send(err)
      })
  } catch (e) {
    console.error('Error in showImage:', e)
    errorController.showErrorPage(req, res, e)
  }
}
// makes http get, returns stream in promise - takes src and pathname
function httpCall(src) {
  return new Promise((resolve, reject) => {
    let format = imageFormat(src)
    https.get(src, (response) => {
      if (response.statusCode === 200) {
        log('status of url call', response.statusCode)
        const transform = new streamTransform()
        response.on('data', (chunk) => {
          transform.push(chunk)
        })
        response.on('end', () => {
          log('serving from: cloud')
          resolve(transform)
        })
      } else {
        error(`An http error occured`, response.statusCode)
        reject('promise in http.get rejected')
      }
    })
  })
}
// returns an object - stream piped to res
function resize(stream, width, height) {
  try {
    var transformer = sharp()
      .resize(width, height)
      .on('info', function (info) {
        log('Resize: okay', info)
      })
      .on('error', (e) => {
        log('Error in Resize', e)
      })
    return stream.pipe(transformer)
  } catch (e) {
    console.error('Error in Resize', e)
    throw TypeError('Error resizing image', e)
  }
}
function setImageQuality(urlStr, quality) {
  try {
    switch (quality) {
      case 'high':
        quality = `q_auto:best`
        break
      case 'good':
        quality = `q_auto:good`
        break
      case 'eco':
        quality = `q_auto:eco`
        break
      case 'low':
        quality = `q_auto:low`
        break
      default:
        quality = 'q_auto'
    }
    const splitArr = urlStr.split('/')
    // console.log('splitArr', splitArr)
    const index = splitArr.indexOf('q_auto:eco')
    splitArr[index] = quality
    // console.log('JOIN', splitArr.join('/'))
    return splitArr.join('/')
  } catch (e) {
    console.error('An error in setImageQuality', e)
  }
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
  return `${fileNoExt}.${newExt} `
}
// -- getter - no args
// --setter - with args
closureCache = (function () {
  let imgs = []
  return function ({ pathname, buffer: buffer, reset: reset }) {
    // if (reset) {
    //   imgs = []
    //   return []
    // }
    // // getter
    // if (arguments.length <= 0) {
    //   return imgs
    // }
    // // setter
    // let imgObj = {}
    // imgObj[pathname] = buffer
    // // add format to obj
    // imgObj['format'] = format
    // // console.log('imgObj', imgObj)
    // imgs.push(imgObj)
    // // if this is called, image is coming from cloud
    // return imgs
  }
})()

// checks if pathname is inside the cache
// take arr of objects with path/buffer key vals, + pathname
function getCache(arr, pathname) {
  if (!Array.isArray(arr) || typeof pathname !== 'string') {
    console.error('Error in getCache params')
    return false
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
