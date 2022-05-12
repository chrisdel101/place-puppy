const fs = require('fs')
const url = require('url')
const debug = require('debug')
const log = debug('app:log')
const error = debug('app:error')

module.exports = {
  filterImages: filterImages,
  extractDims: extractDims,
  removeFwdSlash: removeFwdSlash,
  checkAllDigits: checkAllDigits,
}
function checkAllDigits(pathName) {
  // all before the x
  let re = /[a-z0-9]+(?=\x)/g
  let first = pathName.match(re).join('')
  let reversePath = Array.from(pathName).reverse().join('')
  let second = reversePath.match(re)
  second = Array.from(second).reverse().join('')
  // only match digits
  let match1 = first.match(/^\d+$/)
  let match2 = second.match(/^\d+$/)
  if (!match1 || !match2) {
    return false
  }
  return true
}

function removeFwdSlash(str) {
  // 	check if starts with /
  let re = /^\//gi
  if (str.match(re)) {
    return str.slice(1, str.length)
  }
  return str
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
    log('width', width)
    log('height', height)
    return { width, height }
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
