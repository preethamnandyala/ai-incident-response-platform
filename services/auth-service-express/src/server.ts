import app from './app'
import { env } from './config/env'

const PORT = env.port || 3001

app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/health`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})