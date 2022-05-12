exports.qualityMiddleware = (req, res, next) => {
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
            default:
                console.error("Error: Invalid query string in qualityMiddleware")
        }
    }
    next()
}
exports.returnImageFormat = (req, res, next) => {
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
