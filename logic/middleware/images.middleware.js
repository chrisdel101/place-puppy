const debug = require('debug')
const log = debug('app:log')
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
