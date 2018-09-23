exports.qualityMiddleware = (req,res,next) => {
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
