import app from './app'
import { env } from './config/env'

const PORT = env.port || 3000

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/health`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log('Routing:')
    console.log(`  /api/auth      → ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`)
    console.log(`  /api/incidents → ${process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002'}`)
    console.log(`  /api/logs      → ${process.env.LOG_SERVICE_URL || 'http://localhost:3003'}`)
    console.log(`  /api/ai        → ${process.env.AI_SERVICE_URL || 'http://localhost:3004'}`)
    console.log(`  /api/notify    → ${process.env.NOTIFY_SERVICE_URL || 'http://localhost:3005'}`)
})