const sharp = require('sharp')
const { extractDims, preSetImages } = require('../utils')
const images = require('../../images.json')
const https = require('https')
const streamTransform = require('stream').Transform
const Stream = require('stream')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const stats = debug('app:stats')
const errorController = require('./error.controller')
let cache = {}
let currentUserIp
let imageRequests = 0
let imagesCached = 0
let imagesRetrievedCache = 0

// quality and customFormat are querys - blank by default
function showImage(req, res) {
  try {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    log('req ip', req.ip)
    log('ip', ip)
    stats('imageRequests', imageRequests)
    stats('imagesCached', imagesCached)
    stats('imagesRetrievedCache', imagesRetrievedCache)
    log('Path', req.originalUrl)
    if (req.quality) log('Quality', req.quality)
    if (req.customFormat) log('Format', req.customFormat)
    const dimensions = req.params.dimensions
    if (!dimensions) {
      console.error('Error with page dimensions:')
      throw Error('An error occured processing image dimensions')
    }
    // extract img w/h
    const [width, height] = extractDims(req.params.dimensions)
    // only access cache if same user
    if (req?.ip !== currentUserIp) {
      // store user IP
      currentUserIp = req?.ip
      // empty cache
      cache = {}
    } else if(process.env.CACHE !== 'OFF'){
      // if in cache call from cache
      if (cache?.[req.originalUrl]) {
        //originalUrl is all combined - 300x300?q=good?f=png
        let buffer = cache[req.originalUrl]
        // Initiate the source
        var bufferStream = new Stream.PassThrough()
        // Write your buffer
        bufferStream.end(new Buffer.from(buffer))
        log('Serving from: cache')
        imageRequests++
        imagesRetrievedCache++
        // resize
        return resize(bufferStream, width, height).pipe(res)
      }
    }
    let img = {}
    // if one of the preset images, send this
    if (preSetImages.includes(dimensions)) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].path === dimensions) {
          img = { ...images[i] }
          break
        }
      }
    } else {
      // else get one at random
      img = images[Math.floor(Math.random() * 20)]
    }
    let imgFormatType = imageFormat(img.contentType)
    // set custom format from query
    if (req?.customFormat) {
      let newSrc = replaceUrlExt(img?.src, req.customFormat)
      img.src = newSrc
    }
    // set custom quality from query
    if (req?.quality) {
      let newSrc = setImageQuality(img?.src, req?.quality)
      img.src = newSrc
    }
    img.src = embedDimensionsIntoLink(img.src, width, height)
    // set type
    res.type(`image/${imgFormatType ?? 'jpg'}`)
    httpCall(img.src, dimensions)
      .then((transform) => {
        // read data with.read()
        const parsedBuffer = transform.read()
        //stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
        // Initiate the source
        // CACHE- add and remove from cache
        cache[req?.originalUrl ?? req?.path] = parsedBuffer
        var stream = new Stream.PassThrough()
        // Write your buffer
        stream.end(new Buffer.from(parsedBuffer))
        // store current user IP
        currentUserIp = req?.ip
        imageRequests++
        imagesCached++
        return stream.pipe(res)      
      })
      .catch((err) => {
        error('An error in the promise ending show', err)
        res.status(500).send(err)
      })
  } catch (e) {
    console.error('Error in showImage:', e)
    errorController.showErrorPage(req, res, e)
  }
}
// format is /w_400,h_400,c_fill/
function embedDimensionsIntoLink(src, width, height) {
  let strsArr = src.split('/')
  const w = `w_${width}`
  const h = `h_${height}`
  // find upload in arr
  const uploadIndex = strsArr.indexOf('upload')
  strsArr.splice(uploadIndex + 1, 0, `${w},${h},c_fill`)
  return strsArr.join('/')
}
function httpCall(src) {
  return new Promise((resolve, reject) => {
    let format = imageFormat(src)
    log('Calling: ', src)
    https.get(src, (response) => {
      if (response.statusCode === 200) {
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
function setImageQuality(urlStr, quality) {
  try {
    switch (quality) {
      case 'best':
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
    const index = splitArr.indexOf('q_auto:eco')
    splitArr[index] = quality
    return splitArr.join('/')
  } catch (e) {
    console.error('An error in setImageQuality', e)
  }
}

function imageFormat(imgSrc) {
  // convert to lower
  if (typeof imgSrc !== 'string') {
    error('imageFormat error: imgSrc must be a string')
    throw TypeError('imageFormat error: imgSrc must be a string')
  } else {
    imgSrc = imgSrc.toLowerCase()

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
}
function replaceUrlExt(imgUrl, newExt) {
  let fileNoExt = imgUrl.split('.').slice(0, -1).join('.')
  return `${fileNoExt}.${newExt} `
}
const setCache = ({ path, buffer }) => {
  log('Set cache', path)
  cache[path] = buffer
}

module.exports = {
  imageFormat: imageFormat,
  showImage: showImage,
  setImageQuality: setImageQuality,
  replaceUrlExt: replaceUrlExt,
  httpCall: httpCall,
}
