import { IncidentAI } from '@incidentai/sdk'

const monitor = new IncidentAI({
    apiKey: 'org_default',
    service: 'user-service',
    apiUrl: 'http://localhost:3000'
})

const userScenarios = [
    {
        level: 'info' as const,
        message: 'User logged in successfully',
        metadata: { userId: 'user_123', method: 'email' }
    },
    {
        level: 'info' as const,
        message: 'User registered',
        metadata: { userId: 'user_456', plan: 'free' }
    },
    {
        level: 'warning' as const,
        message: 'Failed login attempt',
        metadata: { email: 'test@example.com', attempts: 3 }
    },
    {
        level: 'warning' as const,
        message: 'Password reset requested',
        metadata: { userId: 'user_789', ip: '192.168.1.1' }
    },
    {
        level: 'error' as const,
        message: 'User session expired unexpectedly',
        metadata: { userId: 'user_321', sessionAge: 7200 }
    }
]

const criticalScenarios = [
    {
        message: 'Auth database connection lost',
        metadata: { host: 'db.auth.internal', port: 5432 }
    },
    {
        message: 'JWT secret rotation failed',
        metadata: { reason: 'key_vault_unreachable' }
    },
    {
        message: 'Mass login failures detected — possible attack',
        metadata: { failuresPerMinute: 500, threshold: 100 }
    }
]

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function runUserSimulation(): Promise<void> {
    console.log('Starting user-demo...')
    console.log('Sending logs to IncidentAI platform at http://localhost:3000')
    console.log('Press Ctrl+C to stop\n')

    let iteration = 0

    while (true) {
        iteration++
        console.log(`[Iteration ${iteration}] ${new Date().toISOString()}`)

        const scenario = randomItem(userScenarios)
        await monitor[scenario.level](scenario.message, scenario.metadata)
        console.log(`  → ${scenario.level.toUpperCase()}: ${scenario.message}`)

        if (iteration % 10 === 0) {
            const critical = randomItem(criticalScenarios)
            await monitor.critical(critical.message, critical.metadata)
            console.log(`  → CRITICAL: ${critical.message}`)
            console.log('  → Auto-incident creation triggered!')
        }

        await sleep(7000)
    }
}

process.on('SIGINT', () => {
    console.log('\nStopping user-demo...')
    process.exit(0)
})

runUserSimulation().catch(console.error)