import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes'
import passwordRoutes from './routes/password.routes'
import emailVerificationRoutes from './routes/email-verification.routes'
import passport from './config/passport'
import oauthRoutes from './routes/oauth.routes'

const app = express()

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}))

// Body parsing
app.use(express.json())

// Cookie parsing
app.use(cookieParser())

app.use(passport.initialize())

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', passwordRoutes)
app.use('/api/auth', emailVerificationRoutes)
app.use('/api/auth', oauthRoutes)

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Internal server error' })
})

export default app