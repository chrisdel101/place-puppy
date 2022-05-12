const debug = require('debug')
const log = debug('app:log')
exports.qualityMiddleware = (req, _, next) => {
    if (req.query.q) {
        switch (req.query.q) {
            case 'high':
                req.quality = 'high'
                break
            case 'good':
                req.quality = 'good'
                break
            case 'low':
                req.quality = 'low'
                break
            default:
                log(`Invalid query string ${req.query.q} qualityMiddleware: Default to eco`)
                req.quality = 'eco'
        }
    }
    next()
}
exports.returnImageFormat = (req, _, next) => {
    if (req.query.f) {
        switch (req.query.f) {
            case 'jpg':
                req.format = 'jpg'
                break
            case 'png':
                req.format = 'png'
                break
            case 'gif':
                req.format = 'gif'
                break
            case 'jpeg':
                req.format = 'jpg'
                break
        }
    }
    next()
}
