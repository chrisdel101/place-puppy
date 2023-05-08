const debug = require('debug')
const log = debug('app:log')
// middleware different than controller - fires mid-request the passes the req on

exports.qualityMiddleware = (req, _, next) => {
  // if req.invalidParams flag don't bother to run
  if (req.query.q && !req.invalidParams) {
    switch (req.query.q) {
      case 'best':
        req.customQuality = 100
        break
      case 'good':
        req.customQuality = 75
        break
      case 'low':
        req.customQuality = 25
        break
      default:
        req.customQuality = 50
    }
  } else {
    req.customQuality = 50
  }
  next()
}
exports.returnImageType = (req, _, next) => {
  // if req.invalidParams flag don't bother to run
  if (req.query.f && !req.invalidParams) {
    switch (req.query.f) {
      case 'jpg':
        req.customType = 'jpeg'
        break
      case 'png':
        req.customType = req.query.f
        break
      case 'gif':
        req.customType = req.query.f
        break
      case 'bmp':
        req.customType = req.query.f
        break
      case 'jpeg':
        req.customType = req.query.f
        break
      default:
        req.customType = 'jpeg'
        break
    }
  } else {
    req.customType = 'jpeg'
  }
  next()
}
// - strip out non-valid query params - if any invalid params, all params are stripped
// - set invalidParams flag
// - return req.query object
exports.stripInvalidQueryParams = (req, _, next) => {
  if (req.query) {
    // strip out all query invalid params - use .entries to return a object
    req.query = Object.fromEntries(
      Object.entries(req.query).filter(([key, val]) => {
        // only valid params stay
        if (key === 'q' || key === 'f') {
          return [key, val]
        } else {
          // set flag for use in cache detection
          req.invalidParams = true
        }
      })
    )
  }
  next()
}
