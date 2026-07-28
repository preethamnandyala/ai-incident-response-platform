import axios from 'axios'
import jwt from 'jsonwebtoken'

const GATEWAY_URL = 'http://localhost:3000'
const JWT_SECRET = '6f95068c851c178b6a76ca95bcfec4e57298302eff96c8d7c0016663a1587b'

function generateTestToken(payload: object = {}): string {
    return jwt.sign(
        {
            userId: 'test-user-id',
            role: 'DEVELOPER',
            organizationId: 'org_default',
            ...payload
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    )
}

describe('API Gateway Integration Tests', () => {

    describe('Health check', () => {
        it('should return healthy status', async () => {
            const response = await axios.get(`${GATEWAY_URL}/health`)
            expect(response.status).toBe(200)
            expect(response.data.status).toBe('healthy')
            expect(response.data.service).toBe('api-gateway')
        })
    })

    describe('Public routes — no JWT required', () => {
        it('should allow POST /api/logs/ingest without JWT', async () => {
            const response = await axios.post(
                `${GATEWAY_URL}/api/logs/ingest`,
                {
                    level: 'INFO',
                    message: 'Gateway integration test',
                    service_name: 'gateway-test-service'
                },
                {
                    headers: { 'X-Organization-Id': 'org_default' }
                }
            )
            expect(response.status).toBe(201)
        })

        it('should allow GET /health without JWT', async () => {
            const response = await axios.get(`${GATEWAY_URL}/health`)
            expect(response.status).toBe(200)
        })

        it('should allow POST /api/auth/signup without JWT', async () => {
            // Signup is a public route — no JWT needed
            try {
                await axios.post(
                    `${GATEWAY_URL}/api/auth/signup`,
                    {
                        name: 'Gateway Test',
                        email: `gateway_test_${Date.now()}@test.com`,
                        password: 'TestPass123!'
                    }
                )
            } catch (error: any) {
                // 409 conflict is also acceptable (user exists)
                // what matters is NOT 401 (not unauthorized)
                expect(error.response.status).not.toBe(401)
            }
        })
    })

    describe('Protected routes — JWT required', () => {
        it('should reject GET /api/incidents without JWT', async () => {
            try {
                await axios.get(`${GATEWAY_URL}/api/incidents`)
                fail('Should have thrown')
            } catch (error: any) {
                expect(error.response.status).toBe(401)
            }
        })

        it('should reject GET /api/incidents with invalid JWT', async () => {
            try {
                await axios.get(
                    `${GATEWAY_URL}/api/incidents`,
                    {
                        headers: {
                            'Authorization': 'Bearer invalid-token'
                        }
                    }
                )
                fail('Should have thrown')
            } catch (error: any) {
                expect(error.response.status).toBe(401)
            }
        })

        it('should allow GET /api/incidents with valid JWT', async () => {
            const token = generateTestToken()
            const response = await axios.get(
                `${GATEWAY_URL}/api/incidents`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            expect(response.status).toBe(200)
        })
    })

    describe('JWT forwarding — organizationId header', () => {
        it('should forward X-Organization-Id from JWT to services', async () => {
            const token = generateTestToken({ organizationId: 'org_default' })

            const response = await axios.get(
                `${GATEWAY_URL}/api/incidents`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            expect(response.status).toBe(200)
            expect(Array.isArray(response.data)).toBe(true)
        })

        it('should forward correct organizationId for different orgs', async () => {
            const token = generateTestToken({ organizationId: 'org_test_isolated' })

            const response = await axios.get(
                `${GATEWAY_URL}/api/incidents`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            expect(response.status).toBe(200)
            expect(response.data).toEqual([])
        })
    })
})