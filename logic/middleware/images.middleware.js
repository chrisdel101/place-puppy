exports.qualityMiddleware = (req, res, next) => {
    if (req.query.q) {
        switch (req.query.q) {
            case 'high':
                req.quality = 'high'
                break
            case 'medium':
                req.quality = 'good'
                break
            case 'eco':
                req.quality = 'eco'
                break
            case 'low':
                req.quality = 'low'
                break
        }
    }
    next()
}
exports.returnImageFormat = (req, res, next) => {
    if(req.query.f){
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

function replaceUrlExt(imgUrl, newExt) {
    if (newExt !== 'jpg' && newExt !== 'png' && newExt !== 'gif' && newExt !== 'jpeg') {
        throw new TypeError('Extension is not valid to replace url. Only png, jpg, and gif.')
    }
    if (!imgUrl.includes('jpg') && !imgUrl.includes('png') && !imgUrl.includes('gif') && !imgUrl.includes('jpeg')) {
        throw TypeError("Url is not an image to use replacer")
    }
    let fileNoExt = imgUrl.split('.').slice(0, -1).join('.')
    return `${fileNoExt}.${newExt}`
}
