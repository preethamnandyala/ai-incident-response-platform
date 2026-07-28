import axios from 'axios'
import { Client } from 'pg'

const GATEWAY_URL = 'http://localhost:3000'
const INCIDENT_SERVICE_URL = 'http://localhost:3002'
const LOG_SERVICE_URL = 'http://localhost:3003'
const AI_SERVICE_URL = 'http://localhost:3004'

const pgClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'incident_platform',
    user: 'postgres',
    password: 'postgres'
})

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Platform Pipeline Integration Tests', () => {

    beforeAll(async () => {
        await pgClient.connect()
    })

    afterAll(async () => {
        await pgClient.end()
    })

    describe('Health checks — all services running', () => {
        it('API Gateway should be healthy', async () => {
            const response = await axios.get(`${GATEWAY_URL}/health`)
            expect(response.status).toBe(200)
            expect(response.data.status).toBe('healthy')
        })

        it('Log Service should be healthy', async () => {
            const response = await axios.get(
                `${LOG_SERVICE_URL}/api/logs/health/`
            )
            expect(response.status).toBe(200)
            expect(response.data.status).toBe('healthy')
        })

        it('Incident Service should be healthy', async () => {
            const response = await axios.get(
                `${INCIDENT_SERVICE_URL}/api/incidents/health`
            )
            expect(response.status).toBe(200)
        })

        it('AI Service should be healthy', async () => {
            const response = await axios.get(
                `${AI_SERVICE_URL}/api/ai/health`
            )
            expect(response.status).toBe(200)
            expect(response.data.status).toBe('healthy')
        })
    })

    describe('Log ingestion', () => {
        it('should accept INFO log without creating incident', async () => {
            const before = await pgClient.query(
                'SELECT COUNT(*) FROM incidents'
            )
            const countBefore = parseInt(before.rows[0].count)

            await axios.post(
                `${GATEWAY_URL}/api/logs/ingest`,
                {
                    level: 'INFO',
                    message: 'Pipeline test INFO log',
                    service_name: 'pipeline-test-service'
                },
                {
                    headers: { 'X-Organization-Id': 'org_default' }
                }
            )

            await sleep(2000)

            const after = await pgClient.query(
                'SELECT COUNT(*) FROM incidents'
            )
            const countAfter = parseInt(after.rows[0].count)

            expect(countAfter).toBe(countBefore)
        })

        it('should accept CRITICAL log and create incident', async () => {
            const testMessage = `Pipeline CRITICAL test ${Date.now()}`

            const before = await pgClient.query(
                `SELECT COUNT(*) FROM incidents 
                 WHERE organization_id = 'org_default'`
            )
            const countBefore = parseInt(before.rows[0].count)

            const logResponse = await axios.post(
                `${GATEWAY_URL}/api/logs/ingest`,
                {
                    level: 'CRITICAL',
                    message: testMessage,
                    service_name: 'pipeline-test-service'
                },
                {
                    headers: { 'X-Organization-Id': 'org_default' }
                }
            )

            expect(logResponse.status).toBe(201)

            // Wait for RabbitMQ processing
            await sleep(3000)

            const after = await pgClient.query(
                `SELECT COUNT(*) FROM incidents 
                 WHERE organization_id = 'org_default'`
            )
            const countAfter = parseInt(after.rows[0].count)

            expect(countAfter).toBe(countBefore + 1)
        })

        it('should create incident with correct title', async () => {
            const testMessage = `Title test ${Date.now()}`

            await axios.post(
                `${GATEWAY_URL}/api/logs/ingest`,
                {
                    level: 'CRITICAL',
                    message: testMessage,
                    service_name: 'pipeline-test-service'
                },
                {
                    headers: { 'X-Organization-Id': 'org_default' }
                }
            )

            await sleep(3000)

            const result = await pgClient.query(
                `SELECT * FROM incidents 
                 WHERE service_name = 'pipeline-test-service'
                 ORDER BY created_at DESC LIMIT 1`
            )

            expect(result.rows.length).toBeGreaterThan(0)
            expect(result.rows[0].title).toContain('pipeline-test-service')
            expect(result.rows[0].severity).toBe('CRITICAL')
            expect(result.rows[0].status).toBe('OPEN')
            expect(result.rows[0].organization_id).toBe('org_default')
        })
    })

    describe('Full pipeline verification', () => {
        it('should complete full CRITICAL log → incident flow', async () => {
            const uniqueMessage = `Full pipeline test ${Date.now()}`

            // Step 1: Send CRITICAL log
            const logResponse = await axios.post(
                `${GATEWAY_URL}/api/logs/ingest`,
                {
                    level: 'CRITICAL',
                    message: uniqueMessage,
                    service_name: 'pipeline-test-service',
                    metadata: { test: true, timestamp: Date.now() }
                },
                {
                    headers: { 'X-Organization-Id': 'org_default' }
                }
            )

            expect(logResponse.status).toBe(201)
            const logId = logResponse.data.id
            expect(logId).toBeDefined()

            // Step 2: Wait for RabbitMQ processing
            await sleep(4000)

            // Step 3: Verify incident was created
            const incidentResult = await pgClient.query(
                `SELECT * FROM incidents 
                 WHERE description LIKE $1
                 AND organization_id = 'org_default'
                 ORDER BY created_at DESC LIMIT 1`,
                [`%${logId}%`]
            )

            expect(incidentResult.rows.length).toBe(1)
            const incident = incidentResult.rows[0]

            expect(incident.severity).toBe('CRITICAL')
            expect(incident.status).toBe('OPEN')
            expect(incident.service_name).toBe('pipeline-test-service')
            expect(incident.organization_id).toBe('org_default')
            expect(incident.created_by).toBe('system')
        })
    })
})