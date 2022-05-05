const mongoose = require('mongoose')
const Image = mongoose.models.Image || require('../models/image.model.js')
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
function extractDims(str) {
  if (typeof str !== 'string') {
    error('Incorrect input: Needs to be a string')
    throw new TypeError('Incorrect input: Needs to be a string')
  }
  // all nums before x starting with / - to extract
  let re = /\/\d+(?=\x)/g
  // all nums before x, no /
  let re2 = /\d+(?=\x)/g
  // to help with the reverse - no /
  let re3 = /\d+(?=\x)/g
  // look for dims pattern
  let re4 = /([0-9]+[x][0-9]+)/
  // check that all chars are digits
  let re5 = /^\d+$/ //not used yet
  // check if string is a Url
  if (isValidURL(str)) {
    log('extractDims: is valid URL')
    let newUrl = url.parse(str)
    // check str has the 100x100 format
    if (!newUrl.pathname.match(re)) {
      throw TypeError(
        'extractDims error: input url does not have dims to extract, or the dims are not in the right format. Must be in the pathname or url.'
      )
    }

    // WIDTH
    // get first num
    let width = newUrl.pathname.match(re).join('')
    // remove /
    width = removeFwdSlash(width)
    // HEIGHT
    // reverse String - then use join
    let reverseUrl = Array.from(newUrl.pathname).reverse().join('')
    // extract digits -
    let height = reverseUrl.match(re3).join('')
    // un-reverse back to normal
    height = Array.from(height).reverse().join('')
    // remove /
    height = removeFwdSlash(height)
    log('width', width)
    log('height', height)
    return { width: width, height: height }
  } else {
    if (!str.match(re4)) {
      throw TypeError(
        'extractDims error: input does not contain dims i.e. 100x100 neeeded for extract'
      )
    }
    log('extractDims: is not valid URL but still extract')
    // if not valid url follow, cannot parse out using url mod  above
    let extractDim = str.match(re4)[0]
    let width = extractDim.match(re2).join('')
    // reverse the dims
    let reverseDim = Array.from(extractDim).reverse().join('')
    // extract up until x - then use join to str
    let height = reverseDim.match(re2).join('')
    height = Array.from(height).reverse().join('')
    let obj = {
      width: width,
      height: height,
    }
    log('width/height', obj)
    return obj
  }
  return undefined
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

//stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url/22648406#22648406
https: function isValidURL(str) {
  var urlRegex =
    '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$'
  var url = new RegExp(urlRegex, 'i')
  return str.length < 2083 && url.test(str)
}
