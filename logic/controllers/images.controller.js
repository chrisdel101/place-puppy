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

/**
 * Resets cache after time interval - 12 hours
 * used to free memory
 */
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
/**
 * Add image + meta data to cache based on IP
 * @param {string} IP
 * @param {string} path - with or w.o query params
 * @param {Buffer} data - image data
 * @param {string} type - image/type form
 * @returns {object} cache 
 */
// based on IP - add to cache after fetch
function setCache(IP, path, data, type) {
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
      type: type,
    }
  } else {
    log('LOG: add new IP')
    cache[IP] = {
      [path]: {
        data: data,
        time: dayjs(),
        type: type,
      },
    }
  }
}
/**
 * Fetch data from cache based on IP
 * @param {string} IP 
 * @param {string} path - with or w.o query params
 * @returns {object} - cache
 */
function getCache(IP, path) {
  if (!IP) {
    error('ERROR: no IP or localhost in getCache')
    return
  }
  log('LOG: checking getCache()', path)
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
/**
 * Reset users cache after interval - 1 hour
 * @param {string} IP 
 * @param {string} path - with or w.o query params
 * @returns {boolean} - return true if path deleted

 */
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
/**
 * Shows image based on dimensions
 * @param {object} req 
 * @param {object} res 
 * @returns {Stream} - image stream
 */

exports.showImage = (req, res) => {
  try {
    // IP is client IP or undefined
    const IP = availableIP(req)

    stats('STATS: imageRequests', imageRequests)
    stats('STATS: imagesCached', imagesCached)
    stats('STATS: imagesRetrievedCache', imagesRetrievedCache)
    log('LOG: Path', req.originalUrl)
    log('LOG: stripped params flag', req.invalidParams)

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
      // if invalid query params were stripped, cache .path only
      let cachePath
      if (req.invalidParams) {
        cachePath = req.path
      } else {
        // for valid query params only
        cachePath = req.originalUrl
      }
      // get cached data by IP and path
      const cachedIPContent = getCache(IP, cachePath)
      // if cache, serve cache
      if (cachedIPContent) {
        // set res type from cache, or defaul to jpg
        if (!res.get('Content-type'))  res.type
        (cachedIPContent?.[req.originalUrl]?.type ||
         cachedIPContent?.[req.path]?.type ?
          `${cachedIPContent?.[req.originalUrl]?.type || cachedIPContent?.[req.path]?.type}` : 'image/jpg')
        var stream = new Stream.PassThrough()
        stream.end(
          new Buffer.from(
            cachedIPContent?.[req.originalUrl]?.data ??
              cachedIPContent?.[req.path]?.data
          )
        )
        imageRequests++
        log('LOG: Serving from: cache')
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
      //copy obj, no alter original data
      img = { ...images[Math.floor(Math.random() * 20)] }
    }
    // set type and quality in middleware - default jpeg, 50
    sharp(`.${img.src}`)
      .toFormat(req.customType ?? 'jpeg', { quality: req.customQuality ?? 50 })
      .resize(width, height)
      .toBuffer()
      .then((data) => {
        if (IP && process.env.CACHE !== 'OFF') {
          // if invalid query params were stripped, cache .path only
          if (req.invalidParams) {
            // if any invalid params then ALL params are stripped
            setCache(
              IP,
              req?.path,
              data,
              `image/${req.customType}` ?? 'image/jpg'
            )
          } else {
            setCache(
              IP,
              req?.originalUrl ?? req?.path,
              data,
              `image/${req.customType}` ?? 'image/jpg'
            )
          }
        }
        log('LOG: CACHE', cache[IP])
        log('LOG: Quality', req.customQuality)
        log('LOG: Type', req.customType)
        var stream = new Stream.PassThrough()
        // Write your buffer
        stream.end(new Buffer.from(data))
        // track nums - just for fun
        imagesCached++
        // set mime type
        res.type(`image/${req?.customType}` ?? 'image/jpg')
        return stream.pipe(res)
      })
      .catch((err) => {
        console.error(`Sharp error: ${err}`)
      })
  } catch (e) {
    console.error('Error in showImage:', e)
    errorController.showErrorPage(req, res, e)
  }
}
