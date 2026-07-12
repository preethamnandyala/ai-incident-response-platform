import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { env } from './config/env'
import { authenticateJWT } from './middlewares/auth.middleware'
import { requestId, logger } from './middlewares/logger.middleware'
import { rateLimiter } from './middlewares/rateLimiter.middleware'

const app = express()

// Security
app.use(helmet())

// CORS — only the gateway needs this configured
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}))

// Cookie parsing
app.use(cookieParser())

// Request ID — must run before logger so ID appears in logs
app.use(requestId)

// Request logging
app.use(logger)

// Rate limiting — applies to ALL routes
app.use(rateLimiter)

// Health check — public, no JWT needed
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
    })
})

// Auth routes — public (login, signup do not need JWT)
app.use('/api/auth', createProxyMiddleware({
    target: env.services.auth,
    changeOrigin: true,
    onError: (err: Error, req: any, res: any) => {
    res.status(502).json({ error: 'X service unavailable' })
    }
}))

// Protected routes — JWT required
app.use('/api/incidents',
    authenticateJWT,
    createProxyMiddleware({
        target: env.services.incident,
        changeOrigin: true,
        onError: (err: Error, req: any, res: any) => {
          res.status(502).json({ error: 'X service unavailable' })
        }
    })
)

app.use('/api/logs',
    authenticateJWT,
    createProxyMiddleware({
        target: env.services.log,
        changeOrigin: true,
        onError: (err: Error, req: any, res: any) => {
          res.status(502).json({ error: 'X service unavailable' })
        }
    })
)

app.use('/api/ai',
    authenticateJWT,
    createProxyMiddleware({
        target: env.services.ai,
        changeOrigin: true,
        onError: (err: Error, req: any, res: any) => {
          res.status(502).json({ error: 'X service unavailable' })
        }
    })
)

app.use('/api/notify',
    authenticateJWT,
    createProxyMiddleware({
        target: env.services.notify,
        changeOrigin: true,
        onError: (err: Error, req: any, res: any) => {
          res.status(502).json({ error: 'X service unavailable' })
        }
    })
)

export default app