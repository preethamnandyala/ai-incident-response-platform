import { IncidentAI } from '@incidentai/sdk'

const monitor = new IncidentAI({
    apiKey: 'org_default',
    service: 'inventory-service',
    apiUrl: 'http://localhost:3000'
})

const inventoryScenarios = [
    {
        level: 'info' as const,
        message: 'Stock updated successfully',
        metadata: { productId: 'prod_123', quantity: 500 }
    },
    {
        level: 'info' as const,
        message: 'Order fulfilled',
        metadata: { orderId: 'ord_456', items: 3 }
    },
    {
        level: 'warning' as const,
        message: 'Low stock alert',
        metadata: { productId: 'prod_789', remaining: 5, threshold: 10 }
    },
    {
        level: 'warning' as const,
        message: 'Warehouse sync delayed',
        metadata: { warehouse: 'WH-001', delayMs: 5000 }
    },
    {
        level: 'error' as const,
        message: 'Failed to update stock',
        metadata: { productId: 'prod_321', reason: 'lock_timeout' }
    }
]

const criticalScenarios = [
    {
        message: 'Inventory database corrupted',
        metadata: { table: 'products', affectedRows: 1500 }
    },
    {
        message: 'Warehouse management system unreachable',
        metadata: { warehouse: 'WH-001', downtime_ms: 120000 }
    },
    {
        message: 'Stock count mismatch detected — possible theft',
        metadata: { productId: 'prod_999', expected: 100, actual: 45 }
    }
]

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function runInventorySimulation(): Promise<void> {
    console.log('Starting inventory-demo...')
    console.log('Sending logs to IncidentAI platform at http://localhost:3000')
    console.log('Press Ctrl+C to stop\n')

    let iteration = 0

    while (true) {
        iteration++
        console.log(`[Iteration ${iteration}] ${new Date().toISOString()}`)

        const scenario = randomItem(inventoryScenarios)
        await monitor[scenario.level](scenario.message, scenario.metadata)
        console.log(`  → ${scenario.level.toUpperCase()}: ${scenario.message}`)

        if (iteration % 10 === 0) {
            const critical = randomItem(criticalScenarios)
            await monitor.critical(critical.message, critical.metadata)
            console.log(`  → CRITICAL: ${critical.message}`)
            console.log('  → Auto-incident creation triggered!')
        }

        await sleep(9000)
    }
}

process.on('SIGINT', () => {
    console.log('\nStopping inventory-demo...')
    process.exit(0)
})

runInventorySimulation().catch(console.error)