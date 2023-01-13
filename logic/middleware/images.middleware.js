const debug = require('debug')
const log = debug('app:log')
// middleware different than controller - fires mid-request the passes the req on

exports.qualityMiddleware = (req, _, next) => {
  if (req.query.q) {
    switch (req.query.q) {
      case 'best':
        req.quality = 'best'
        break
      case 'good':
        req.quality = 'good'
        break
      case 'low':
        req.quality = 'low'
        break
      default:
        log(
          `Qualituy Params: Invalid query string ${req.query.q} qualityMiddleware: Default to eco`
        )
        req.invalidUrlForm = true
        req.quality = 'eco'
    }
  }
  next()
}
exports.returnImageFormat = (req, _, next) => {
  if (req.query.f) {
    switch (req.query.f) {
      case 'jpg':
        req.customFormat = req.query.f
        break
      case 'png':
        req.customFormat = req.query.f
        break
      case 'gif':
        req.customFormat = req.query.f
        break
      case 'bmp':
        req.customFormat = req.query.f
        break
      case 'jpeg':
        req.customFormat = 'jpg'
        break
      default:
        log(
          `customFormat Params: Invalid query string ${req.query.q} qualityMiddleware: Default to jpg`
        )
        req.invalidUrlForm = true
        req.customFormat = 'jpg'
        break
    }
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
