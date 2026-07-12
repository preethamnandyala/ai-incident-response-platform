import dotenv from 'dotenv'
dotenv.config()

export const env = {
    port: Number(process.env.PORT) || 3000,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || ''
    },
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        incident: process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002',
        log: process.env.LOG_SERVICE_URL || 'http://localhost:3003',
        ai: process.env.AI_SERVICE_URL || 'http://localhost:3004',
        notify: process.env.NOTIFY_SERVICE_URL || 'http://localhost:3005'
    },
    rateLimit: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        max: Number(process.env.RATE_LIMIT_MAX) || 100
    }
}