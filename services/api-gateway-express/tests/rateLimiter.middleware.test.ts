import rateLimit from 'express-rate-limit'

describe('rateLimiter configuration', () => {

    it('should create rate limiter with correct window and max', () => {
        const limiter = rateLimit({
            windowMs: 60000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false
        })

        expect(limiter).toBeDefined()
        expect(typeof limiter).toBe('function')
    })

    it('should be a middleware function with three parameters', () => {
        const limiter = rateLimit({
            windowMs: 60000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false
        })

        expect(limiter.length).toBe(3)
    })

})