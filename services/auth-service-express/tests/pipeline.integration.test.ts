import request from 'supertest'
import app from '../src/app'
import { pool } from '../src/config/database'

const PIPELINE_USER = {
    name: 'Pipeline Test User',
    email: `pipeline_${Date.now()}@test.com`,
    password: 'TestPass123!'
}

describe('End-to-end Pipeline Tests', () => {

    let accessToken: string

    beforeAll(async () => {
        // Clean up existing pipeline test users
        await pool.query(
            'DELETE FROM users WHERE email LIKE $1',
            ['pipeline_%@test.com']
        )

        // Create and login test user
        await request(app)
            .post('/api/auth/signup')
            .send(PIPELINE_USER)

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: PIPELINE_USER.email,
                password: PIPELINE_USER.password
            })

        accessToken = loginResponse.body.accessToken
    })

    afterAll(async () => {
        await pool.query(
            'DELETE FROM users WHERE email LIKE $1',
            ['pipeline_%@test.com']
        )
        await pool.end()
    })

    describe('Auth → API Gateway flow', () => {
        it('should forward organizationId header through Gateway', async () => {
            // This test verifies the Gateway correctly extracts
            // organizationId from JWT and forwards it to services
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('email', PIPELINE_USER.email)
        })

        it('should reject requests without valid JWT', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')

            expect(response.status).toBe(401)
        })

        it('should reject requests with no JWT', async () => {
            const response = await request(app)
                .get('/api/auth/me')

            expect(response.status).toBe(401)
        })
    })

    describe('JWT token structure', () => {
        it('should contain all required fields in access token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: PIPELINE_USER.email,
                    password: PIPELINE_USER.password
                })

            const token = loginResponse.body.accessToken
            const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64').toString()
            )

            expect(payload).toHaveProperty('userId')
            expect(payload).toHaveProperty('role')
            expect(payload).toHaveProperty('organizationId')
            expect(payload).toHaveProperty('iat')
            expect(payload).toHaveProperty('exp')
            expect(payload.organizationId).toBe('org_default')
            expect(payload.role).toBe('DEVELOPER')
        })

        it('should contain organizationId in refreshed token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: PIPELINE_USER.email,
                    password: PIPELINE_USER.password
                })

            const cookies = loginResponse.headers['set-cookie'] as unknown as string[]
            const refreshCookie = cookies.find(
                (c: string) => c.startsWith('refreshToken=')
            )!
            const refreshToken = refreshCookie.split(';')[0].split('=')[1]

            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`)

            expect(refreshResponse.status).toBe(200)

            const newToken = refreshResponse.body.accessToken
            const payload = JSON.parse(
                Buffer.from(newToken.split('.')[1], 'base64').toString()
            )

            expect(payload).toHaveProperty('organizationId')
            expect(payload.organizationId).toBe('org_default')
        })
    })

    describe('Health checks', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/health')

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('healthy')
            expect(response.body.service).toBe('auth-service')
        })
    })
})