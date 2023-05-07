const { extractDims, preSetImages, availableIP } = require('../utils')
let images = require('../../images.json')
const Stream = require('stream')
const sharp = require('sharp')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')
const stats = debug('app:stats')
const errorController = require('./error.controller')
let cache = {}
let imageRequests = 0
let imagesCached = 0
let imagesRetrievedCache = 0
const dayjs = require('dayjs')
let cacheResetTime = dayjs()

// reset cache after iterval - free memory reset any err
function resetCacheInterval() {
  const hourDiff = dayjs().diff(cacheResetTime, 'hours')
  log('LOG (temp): Last Reset', cacheResetTime.format())
  if (hourDiff >= 12) {
    log('LOG: reset full cache timer')
    // empty cache
    cache = {}
    // reset start time
    cacheResetTime = dayjs()
  }
}
// based on IP - add to cache after fetch
function setCache(IP, path, data) {
  if (!IP) {
    error('ERROR: no IP or localhost in getCache')
    return
  }
  // adding to cache
  log('LOG: adding to cache')
  log('LOG: current user cache', cache[IP])
  if (cache[IP]) {
    log('LOG: add path to existing IP')
    cache[IP][path] = {
      data: data,
      time: dayjs(),
    }
  } else {
    log('LOG: add new IP')
    cache[IP] = {
      [path]: {
        data: data,
        time: dayjs(),
      },
    }
  }
}
function getCache(IP, path) {
  if (!IP) {
    error('ERROR: no IP or localhost in getCache')
    return
  }
  log('LOG: checking cache path', path)
  if (cache[IP]) {
    if (cache[IP]?.[path]) {
      // if item was removed no cache
      if (resetUserCachePath(IP, path)) {
        return false
      }
      // if item not removed then cache okay
      return cache[IP]
    }
  }
}
// return true if path deleted
function resetUserCachePath(IP, path) {
  const hourDiff = dayjs().diff(cache[IP]?.[path]?.time, 'hour')
  // remote path from cache after 1 hour
  if (hourDiff >= 1) {
    // delete path from obj
    log(`LOG: delete user path ${path} after ${hourDiff} hour`)
    return delete cache[IP]?.[path]
  }
  return false
}

function showImage(req, res) {
  try {
    // IP is client IP or undefined
    const IP = availableIP(req)

    stats('STATS: imageRequests', imageRequests)
    stats('STATS: imagesCached', imagesCached)
    stats('STATS: imagesRetrievedCache', imagesRetrievedCache)
    log('LOG: Path', req.originalUrl)

    const dimensions = req.params.dimensions
    if (!dimensions) {
      console.error('Error with page dimensions:')
      throw Error('An error occured processing image dimensions')
    }
    // extract img w/h
    const [width, height] = extractDims(req.params.dimensions)
    // check reset interval
    resetCacheInterval()
    // cache off flag for testing
    if (process.env.CACHE !== 'OFF') {
      // get cached data by IP and path
      const cachedIPContent = getCache(IP, req.originalUrl ?? req.path)
      // if cache, serve cache
      if (cachedIPContent) {
        if (!res.get('Content-type')) res.type(`image/jpg`)
        var stream = new Stream.PassThrough()
        stream.end(
          new Buffer.from(
            cachedIPContent?.[req.originalUrl]?.data ??
              cachedIPContent?.[req.path]?.data
          )
        )
        log('LOG: Serving from: cache')
        imageRequests++
        imagesRetrievedCache++
        return stream.pipe(res)
      }
    }
    let img = {}
    // if one of the preset images, send this
    if (preSetImages.includes(dimensions)) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].path === dimensions) {
          //copy obj, no alter original data
          img = { ...images[i] }
          break
        }
      }
    } else {
      // else get one at random
      //copy obj, no aalter original data
      img = { ...images[Math.floor(Math.random() * 20)] }
    }
    // set type and quality in middleware
    sharp(`.${img.src}`)
      .toFormat(req.customType ?? 'jpeg', { quality: req.customeQuality ?? 50 })
      .resize(width, height)
      .toBuffer()
      .then((data) => {
        log('LOG: Quality', req.customeQuality)
        log('LOG: Type', req.customType)
        var stream = new Stream.PassThrough()
        // Write your buffer
        stream.end(new Buffer.from(data))
        // track nums for fun
        imagesCached++
        // set mime type
        res.type(`image/${req.customType} ?? 'jpg'}`)
        return stream.pipe(res)
      })
      .catch((err) => {
        console.log(`Sharp error: ${err}`)
      })
  } catch (e) {
    console.error('Error in showImage:', e)
    errorController.showErrorPage(req, res, e)
  }
}

module.exports = {
  showImage: showImage,
}
