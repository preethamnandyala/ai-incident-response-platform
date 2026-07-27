import app from './app'
import { env } from './config/env'
import { runMigrations } from './config/migrate'

const PORT = env.port || 3001

async function start() {
    try {
        await runMigrations()
        app.listen(PORT, () => {
            console.log(`Auth service running on port ${PORT}`)
            console.log(`Health check: http://localhost:${PORT}/health`)
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

start()