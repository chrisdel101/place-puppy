const { extractDims, preSetImages, availableIP } = require('../utils');
const images = require('../../images.json');
const https = require('https');
const streamTransform = require('stream').Transform;
const Stream = require('stream');
const debug = require('debug');
const log = debug('app:log');
const error = debug('app:error');
const stats = debug('app:stats');
const errorController = require('./error.controller');
let cache = {};
let imageRequests = 0;
let imagesCached = 0;
let imagesRetrievedCache = 0;
const dayjs = require('dayjs');
const cacheResetTime = dayjs()

function resetCacheInterval(){
  if(dayjs().diff(dayjs().diff(cacheResetTime, 'hour') >= 12, 'hour') < 1){
    // empty cache
    cache = {}
    // reset start time
    cacheResetTime = dayjs()
  }
}

function addToCache(IP, path, data) {
  if (!IP) {
    error('ERROR: no IP or localhost in handleCache');
    return;
  }
  // adding to cache
  log('LOG: adding to cache');
  log('LOG: current cache', cache);
  if(cache[IP]){
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
    };

  }
}
function handleCache(IP, path) {
  if (!IP) {
    error('ERROR: no IP or localhost in handleCache');
    return;
  }
  log('LOG: checking cache', path);
  log('LOG: current cache', cache);
  // getting from cache
  if (cache[IP]) {
    if (cache[IP]?.[path]) {
      // expire user cache after 1 hour
      if (dayjs().diff(cache[IP]?.[path].time, 'hour') < 1) {
        return cache[IP];
      } 
    }
  }
}
// quality and customFormat are querys - blank by default
function showImage(req, res) {
  try {    
    // IP is client IP or undefined
    const IP = availableIP(req);

    stats('STATS: imageRequests', imageRequests);
    stats('STATS: imagesCached', imagesCached);
    stats('STATS: imagesRetrievedCache', imagesRetrievedCache);
    log('LOG: Path', req.originalUrl);

    if (req.quality) log('LOG: Quality', req.quality);
    if (req.customFormat) log('LOG: Format', req.customFormat);
    const dimensions = req.params.dimensions;
    if (!dimensions) {
      console.error('Error with page dimensions:');
      throw Error('An error occured processing image dimensions');
    }
    // extract img w/h
    const [width, height] = extractDims(req.params.dimensions);
    // only access cache if same user
    resetCacheInterval()
    if (process.env.CACHE !== 'OFF') {
      const cachedIPContent = handleCache(
        IP,
         req.originalUrl ?? req.path
      );
      // if in cache serve cache
      if (cachedIPContent) {
        var stream = new Stream.PassThrough();
        stream.end(
          new Buffer.from(
            cachedIPContent?.[req.originalUrl]?.data ?? 
            cachedIPContent?.[req.path]?.data
          )
        );
        log('LOG: Serving from: cache');
        imageRequests++;
        imagesRetrievedCache++;
        return stream.pipe(res);
      }
    }
    let img = {};
    // if one of the preset images, send this
    if (preSetImages.includes(dimensions)) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].path === dimensions) {
          img = { ...images[i] };
          break;
        }
      }
    } else {
      // else get one at random
      img = images[Math.floor(Math.random() * 20)];
    }
    let imgFormatType = imageFormat(img.contentType);
    // set custom format from query
    if (req?.customFormat) {
      let newSrc = replaceUrlExt(img?.src, req.customFormat);
      img.src = newSrc;
    }
    // set custom quality from query
    if (req?.quality) {
      let newSrc = setImageQuality(img?.src, req?.quality);
      img.src = newSrc;
    }
    img.src = embedDimensionsIntoLink(img.src, width, height);
    // set type
    res.type(`image/${imgFormatType ?? 'jpg'}`);
    httpCall(img.src, dimensions)
      .then((transform) => {
        // read data with.read()
        const parsedBuffer = transform.read();
        // Initiate the source
        // CACHE- add to cache if possible
        if (IP) {
          // add to cache
          if(req.invalidUrlForm){
            console.log('invalid url form')
            addToCache(IP, req?.path, parsedBuffer);
          } else {
            addToCache(IP, req?.originalUrl ?? req?.path, parsedBuffer);
          }
        }
        //stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
        var stream = new Stream.PassThrough();
        // Write your buffer
        stream.end(new Buffer.from(parsedBuffer));
        // store current user IP
        imageRequests++;
        imagesCached++;
        return stream.pipe(res);
      })
      .catch((err) => {
        error('An error in the promise ending show', err);
        res.status(500).send(err);
      });
  } catch (e) {
    console.error('Error in showImage:', e);
    errorController.showErrorPage(req, res, e);
  }
}
// format is /w_400,h_400,c_fill/
function embedDimensionsIntoLink(src, width, height) {
  let strsArr = src.split('/');
  const w = `w_${width}`;
  const h = `h_${height}`;
  // find upload in arr
  const uploadIndex = strsArr.indexOf('upload');
  strsArr.splice(uploadIndex + 1, 0, `${w},${h},c_fill`);
  return strsArr.join('/');
}
function httpCall(src) {
  return new Promise((resolve, reject) => {
    let format = imageFormat(src);
    log('LOG: Calling: ', src);
    https.get(src, (response) => {
      if (response.statusCode === 200) {
        const transform = new streamTransform();
        response.on('data', (chunk) => {
          transform.push(chunk);
        });
        response.on('end', () => {
          log('LOG: serving from: cloud');
          resolve(transform);
        });
      } else {
        error(`An http error occured`, response.statusCode);
        reject('promise in http.get rejected');
      }
    });
  });
}
function setImageQuality(urlStr, quality) {
  try {
    switch (quality) {
      case 'best':
        quality = `q_auto:best`;
        break;
      case 'good':
        quality = `q_auto:good`;
        break;
      case 'eco':
        quality = `q_auto:eco`;
        break;
      case 'low':
        quality = `q_auto:low`;
        break;
      default:
        quality = 'q_auto';
    }
    const splitArr = urlStr.split('/');
    const index = splitArr.indexOf('q_auto:eco');
    splitArr[index] = quality;
    return splitArr.join('/');
  } catch (e) {
    console.error('An error in setImageQuality', e);
  }
}

function imageFormat(imgSrc) {
  // convert to lower
  if (typeof imgSrc !== 'string') {
    error('imageFormat error: imgSrc must be a string');
    throw TypeError('imageFormat error: imgSrc must be a string');
  } else {
    imgSrc = imgSrc.toLowerCase();

    if (imgSrc.includes('jpeg') || imgSrc.includes('jpg')) {
      return 'jpg';
    } else if (imgSrc.includes('png')) {
      return 'png';
    } else if (imgSrc.includes('gif')) {
      return 'gif';
    } else {
      return false;
    }
  }
}
function replaceUrlExt(imgUrl, newExt) {
  let fileNoExt = imgUrl.split('.').slice(0, -1).join('.');
  return `${fileNoExt}.${newExt} `;
}
const setCache = ({ path, buffer }) => {
  log('LOG: Set cache', path);
  cache[path] = buffer;
};

module.exports = {
  imageFormat: imageFormat,
  showImage: showImage,
  setImageQuality: setImageQuality,
  replaceUrlExt: replaceUrlExt,
  httpCall: httpCall,
};
