const debug = require('debug')
const log = debug('app:log')
// middleware different than controller - fires mid-request the passes the req on

exports.qualityMiddleware = (req, _, next) => {
  if (req.query.q) {
    switch (req.query.q) {
      case 'best':
        req.customeQuality = 100
        break
      case 'good':
        req.customeQuality = 75
        break
      case 'low':
        req.customeQuality = 25
        break
      default:
        req.customeQuality = 50
    }
  } else {
    req.customeQuality = 50
  }
  next()
}
exports.returnImageType = (req, _, next) => {
  if (req.query.f) {
    switch (req.query.f) {
      case 'jpg':
        req.customType = "jpeg"
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
exports.stripInvalidQueryParams = (req, _, next) => {
  if (req.query) {
    // strip out all query invalid params
    req.query = Object.fromEntries(
      Object.entries(req.query).filter(([key, val]) => {
        // only valid params stay
        if (key === 'q' || key === 'f') return [key, val]
      })
    )
  }
  next()
}
