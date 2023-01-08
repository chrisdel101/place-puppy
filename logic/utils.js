const fs = require('fs')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

let preSetImages = [
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


// IP used to cache images
function availableIP(req){
  // check for x-forwared
  let xForwardedIp = req.headers['x-forwarded-for']
  log('LOG: xForwardedIp', xForwardedIp)
  // if no x-forward then skip IP checking
  let clientIp = xForwardedIp ? xForwardedIp.split(',')[0] : undefined
  return clientIp
}

// pass in the path in format 300x300
function extractDims(dimensionsStr) {
  try {
    const regex = /\d+x\d+/
    if (typeof dimensionsStr !== 'string') {
      error('Incorrect input: Needs to be a string')
      throw new TypeError('Incorrect input: Needs to be a string')
    }
    if (!regex.test(dimensionsStr)) {
      error('extractDims: Invalid path in url')
      throw new TypeError('Incorrect URL path: Needs to ###x### format')
    }
    const [width, height] = dimensionsStr.split('x')
    log('LOG: width', width)
    log('LOG: height', height)
    return [parseInt(width), parseInt(height)]
  } catch (e) {
    error('Error in extractDims', e)
    throw new TypeError('Error in the URL. Check format')
  }
}
function filterImages(stubsArr, dir) {
  let result = []
  let files = fs.readdirSync(dir)
  // get all files that include the stubs
  files.forEach((file) => {
    stubsArr.forEach((stub) => {
      if (file.includes(stub)) {
        result.push(file)
      }
    })
  })
  return result
}

function hasFileExtension(str) {
  return str.includes('.jpg' || '.png' || '.gif' || '.bmp' || '.jpeg')
}

module.exports = {
  availableIP,
  hasFileExtension,
  filterImages,
  extractDims,
  preSetImages,
}
