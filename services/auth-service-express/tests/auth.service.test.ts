import { AuthService } from '../src/services/auth.service'
import { UserRepository } from '../src/repositories/user.repository'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../src/config/env'
import { mockUserRecord } from './fixtures'

jest.mock('../src/repositories/user.repository')

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('AuthService', () => {

    let authService: AuthService

    beforeEach(() => {
        jest.clearAllMocks()
        authService = new AuthService(new UserRepository())
    })

    describe('signup', () => {

        it('should create a new user when email does not exist', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
            mockUserRepository.prototype.create.mockResolvedValue(mockUserRecord)

            const result = await authService.signup(
                'Hari',
                'hari@example.com',
                'securepassword123'
            )

            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('email', 'hari@example.com')
            expect(result).not.toHaveProperty('passwordHash')
        })

        it('should throw an error when email already exists', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(mockUserRecord)

            await expect(
                authService.signup('Hari', 'hari@example.com', 'securepassword123')
            ).rejects.toThrow('Email already exists')
        })

        it('should hash the password before saving', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
            mockUserRepository.prototype.create.mockResolvedValue(mockUserRecord)

            await authService.signup('Hari', 'hari@example.com', 'securepassword123')

            const createCallArgs = mockUserRepository.prototype.create.mock.calls[0][0]
            expect(createCallArgs.passwordHash).not.toBe('securepassword123')
            expect(createCallArgs.passwordHash).toMatch(/^\$2b\$/)
        })

    })

    describe('login', () => {

        it('should return access token and user info when credentials are valid', async () => {
            const realHash = await bcrypt.hash('correctpassword', 10)

            mockUserRepository.prototype.findByEmail.mockResolvedValue({
                ...mockUserRecord,
                passwordHash: realHash
            })
            mockUserRepository.prototype.saveRefreshToken.mockResolvedValue(undefined)

            const result = await authService.login(
                'hari@example.com',
                'correctpassword'
            )

            expect(result).toHaveProperty('accessToken')
            expect(result).toHaveProperty('refreshToken')
            expect(result).toHaveProperty('user')
            expect(result.user).toHaveProperty('id', '123')
            expect(result.user).toHaveProperty('email', 'hari@example.com')
            expect(result.user).not.toHaveProperty('passwordHash')
            expect(mockUserRepository.prototype.saveRefreshToken).toHaveBeenCalledWith(
                '123',
                expect.any(String)
            )
        })

        it('should throw invalid error when email does not exist', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(null)

            await expect(
                authService.login('unknown@example.com', 'somepassword')
            ).rejects.toThrow('Invalid email or password')
        })

        it('should throw invalid error when password is wrong', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(mockUserRecord)

            await expect(
                authService.login('hari@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid email or password')
        })

    })

    describe('logout', () => {

        it('should delete refresh token from database', async () => {
            mockUserRepository.prototype.deleteRefreshToken.mockResolvedValue(undefined)

            await authService.logout('some-refresh-token')

            expect(mockUserRepository.prototype.deleteRefreshToken)
                .toHaveBeenCalledWith('some-refresh-token')
        })

        it('should throw error when refresh token is not provided', async () => {
            await expect(
                authService.logout('')
            ).rejects.toThrow('Refresh token is required')
        })

    })

    describe('refresh', () => {

        it('should return new access token when refresh token is valid', async () => {
            const validRefreshToken = jwt.sign(
                { userId: '123' },
                env.jwt.refreshSecret,
                { expiresIn: '7d' }
            )

            mockUserRepository.prototype.findRefreshToken.mockResolvedValue({
                userId: '123',
                token: validRefreshToken
            })
            mockUserRepository.prototype.findById.mockResolvedValue(mockUserRecord)

            const result = await authService.refresh(validRefreshToken)

            expect(result).toHaveProperty('accessToken')
        })

        it('should throw error when refresh token is invalid', async () => {
            await expect(
                authService.refresh('invalid-token')
            ).rejects.toThrow('Invalid refresh token')
        })

        it('should throw error when refresh token not found in database', async () => {
            const validRefreshToken = jwt.sign(
                { userId: '123' },
                env.jwt.refreshSecret,
                { expiresIn: '7d' }
            )

            mockUserRepository.prototype.findRefreshToken.mockResolvedValue(null)

            await expect(
                authService.refresh(validRefreshToken)
            ).rejects.toThrow('Invalid refresh token')
        })

        it('should throw error when user no longer exists', async () => {
            const validRefreshToken = jwt.sign(
                { userId: '123' },
                env.jwt.refreshSecret,
                { expiresIn: '7d' }
            )

            mockUserRepository.prototype.findRefreshToken.mockResolvedValue({
                userId: '123',
                token: validRefreshToken
            })
            mockUserRepository.prototype.findById.mockResolvedValue(null)

            await expect(
                authService.refresh(validRefreshToken)
            ).rejects.toThrow('Invalid refresh token')
        })

    })

    describe('me', () => {

        it('should return user details without passwordHash', async () => {
            mockUserRepository.prototype.findById.mockResolvedValue(mockUserRecord)

            const result = await authService.me('123')

            expect(result).toHaveProperty('id', '123')
            expect(result).toHaveProperty('email', 'hari@example.com')
            expect(result).not.toHaveProperty('passwordHash')
        })

        it('should throw error when user not found', async () => {
            mockUserRepository.prototype.findById.mockResolvedValue(null)

            await expect(
                authService.me('nonexistent-id')
            ).rejects.toThrow('User not found')
        })

    })

})