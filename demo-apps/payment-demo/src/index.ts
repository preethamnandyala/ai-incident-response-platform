import { IncidentAI } from '@incidentai/sdk'

const monitor = new IncidentAI({
    apiKey: 'org_default',
    service: 'payment-service',
    apiUrl: 'http://localhost:3000'
})

// Simulate realistic payment service logs
const paymentScenarios = [
    {
        level: 'info' as const,
        message: 'Payment processed successfully',
        metadata: { amount: 1500, currency: 'USD', customerId: 'cust_123' }
    },
    {
        level: 'info' as const,
        message: 'Refund issued',
        metadata: { amount: 500, currency: 'USD', orderId: 'ord_456' }
    },
    {
        level: 'warning' as const,
        message: 'Payment retry attempt',
        metadata: { attempt: 2, maxAttempts: 3, customerId: 'cust_789' }
    },
    {
        level: 'error' as const,
        message: 'Card declined',
        metadata: { reason: 'insufficient_funds', customerId: 'cust_321' }
    },
    {
        level: 'error' as const,
        message: 'Payment gateway timeout',
        metadata: { duration_ms: 30000, gateway: 'stripe' }
    }
]

const criticalScenarios = [
    {
        message: 'Payment database connection lost',
        metadata: { host: 'db.payment.internal', port: 5432 }
    },
    {
        message: 'Payment gateway completely unreachable',
        metadata: { gateway: 'stripe', duration_ms: 60000 }
    },
    {
        message: 'Fraud detection service down',
        metadata: { service: 'fraud-detector', lastSeen: new Date().toISOString() }
    }
]

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function runPaymentSimulation(): Promise<void> {
    console.log('Starting payment-demo...')
    console.log('Sending logs to IncidentAI platform at http://localhost:3000')
    console.log('Press Ctrl+C to stop\n')

    let iteration = 0

    while (true) {
        iteration++
        console.log(`[Iteration ${iteration}] ${new Date().toISOString()}`)

        // Send a regular log every iteration
        const scenario = randomItem(paymentScenarios)
        await monitor[scenario.level](scenario.message, scenario.metadata)
        console.log(`  → ${scenario.level.toUpperCase()}: ${scenario.message}`)

        // Every 10 iterations send a CRITICAL log (triggers auto-incident)
        if (iteration % 10 === 0) {
            const critical = randomItem(criticalScenarios)
            await monitor.critical(critical.message, critical.metadata)
            console.log(`  → CRITICAL: ${critical.message}`)
            console.log('  → Auto-incident creation triggered!')
        }

        // Wait 5 seconds between iterations
        await sleep(5000)
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nStopping payment-demo...')
    process.exit(0)
})

runPaymentSimulation().catch(console.error)