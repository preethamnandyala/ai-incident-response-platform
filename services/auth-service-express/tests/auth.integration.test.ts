import request from 'supertest'
import app from '../src/app'
import { pool } from '../src/config/database'

const TEST_USER = {
    name: 'Integration Test User',
    email: `integration_${Date.now()}@test.com`,
    password: 'TestPass123!'
}

describe('Auth Service Integration Tests', () => {

    beforeAll(async () => {
        await pool.query(
            'DELETE FROM users WHERE email LIKE $1',
            ['integration_%@test.com']
        )
    })

    afterAll(async () => {
        await pool.query(
            'DELETE FROM users WHERE email LIKE $1',
            ['integration_%@test.com']
        )
        await pool.end()
    })

    describe('POST /api/auth/signup', () => {
        it('should create a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send(TEST_USER)
            expect(response.status).toBe(201)
            expect(response.body).toHaveProperty('id')
            expect(response.body.email).toBe(TEST_USER.email)
            expect(response.body).not.toHaveProperty('passwordHash')
        })

        it('should return 409 when email already exists', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send(TEST_USER)
            expect(response.status).toBe(409)
            expect(response.body.error).toBe('Email already exists')
        })

        it('should return 400 when email is invalid', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Test',
                    email: 'not-an-email',
                    password: 'TestPass123!'
                })
            expect(response.status).toBe(400)
        })

        it('should return 400 when password is too short', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Test',
                    email: 'short@test.com',
                    password: 'short'
                })
            expect(response.status).toBe(400)
        })
    })

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('accessToken')
            expect(response.body).toHaveProperty('user')
            expect(response.body.user.email).toBe(TEST_USER.email)
        })

        it('should return JWT with organizationId in payload', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            expect(response.status).toBe(200)
            const token = response.body.accessToken
            const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64').toString()
            )
            expect(payload).toHaveProperty('organizationId')
            expect(payload.organizationId).toBe('org_default')
        })

        it('should set refresh token as httpOnly cookie', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            expect(response.status).toBe(200)
            const cookies = response.headers['set-cookie'] as unknown as string[]
            expect(cookies).toBeDefined()
            const refreshCookie = cookies.find(
                (c: string) => c.startsWith('refreshToken=')
            )
            expect(refreshCookie).toBeDefined()
            expect(refreshCookie).toContain('HttpOnly')
        })

        it('should return 401 with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: 'WrongPassword123!'
                })
            expect(response.status).toBe(401)
        })

        it('should return 401 with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'TestPass123!'
                })
            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/auth/refresh', () => {
        it('should return new access token with organizationId', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
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
            expect(refreshResponse.body).toHaveProperty('accessToken')

            const newToken = refreshResponse.body.accessToken
            const payload = JSON.parse(
                Buffer.from(newToken.split('.')[1], 'base64').toString()
            )
            expect(payload).toHaveProperty('organizationId')
            expect(payload.organizationId).toBe('org_default')
        })

        it('should return 401 with invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', 'refreshToken=invalid-token')
            expect(response.status).toBe(401)
        })
    })

    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            const { accessToken } = loginResponse.body

            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(meResponse.status).toBe(200)
            expect(meResponse.body.email).toBe(TEST_USER.email)
            expect(meResponse.body).not.toHaveProperty('passwordHash')
        })

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/auth/logout', () => {
    it('should logout and clear refresh token cookie', async () => {
        const logoutUser = {
            name: 'Logout Test User',
            email: `logout_${Date.now()}@test.com`,
            password: 'TestPass123!'
        }

        await request(app)
            .post('/api/auth/signup')
            .send(logoutUser)

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: logoutUser.email,
                password: logoutUser.password
            })

        const { accessToken } = loginResponse.body
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[]
        const refreshCookie = cookies.find(
            (c: string) => c.startsWith('refreshToken=')
        )!
        const refreshToken = refreshCookie.split(';')[0].split('=')[1]

        const logoutResponse = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', `refreshToken=${refreshToken}`)

        expect(logoutResponse.status).toBe(200)

        await pool.query(
            'DELETE FROM users WHERE email = $1',
            [logoutUser.email]
        )
    })
})
})