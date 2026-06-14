import { AuthService } from '../src/services/auth.service'
import { UserRepository } from '../src/repositories/user.repository'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../src/config/env'

// Tell Jest to replace the real UserRepository with a fake version
jest.mock('../src/repositories/user.repository')

//Create a typed mock of UserRepository
const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('AuthService', () => {

  let authService: AuthService

  // Before each test, create a fresh instance of AuthService
  beforeEach(() => {

    jest.clearAllMocks()
    authService = new AuthService(new UserRepository())

  })

  describe('signup', () => {

    it('should create a new user when email does not exist', async () => {
      //Arrange - set up the conditions 
      mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
      mockUserRepository.prototype.create.mockResolvedValue({

        id: '123',
        name: 'Hari',
        email: 'hari@example.com',
        passwordHash: '$2b$10$somehashedpasswordvalue',
        role: 'DEVELOPER',
        createdAt : new Date(),
        updatedAt : new Date()

      })


      // Act - call the function we are testing
      const result = await authService.signup(
        'Hari',
        'hari@example.com',
        'securepassword123'
      )

      // Assert - check the result is what we expected
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('email', 'hari@example.com')
      expect(result).not.toHaveProperty('passwordHash')

    })

    it('should throw an error when email already exists', async () => {
      // Arrange - mock that user already exists
      mockUserRepository.prototype.findByEmail.mockResolvedValue({
        id: '123',
        name: 'Hari',
        email: 'hari@example.com',
        passwordHash: '$2b$10$somehashedpasswordvalue',
        role: 'DEVELOPER',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act and Assert - expect the signup to throw
      await expect(
        authService.signup('Hari', 'hari@example.com', 'securepassword123')
      ).rejects.toThrow('Email already exists')

    })

    it('should hash the password before saving', async () => {

      //Arrange
      mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
      mockUserRepository.prototype.create.mockResolvedValue({
        id: '123',
        name: 'Hari',
        email: 'hari@example.com',
        passwordHash: '$2b$10$somehashedpasswordvalue',
        role: 'DEVELOPER',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      await authService.signup('Hari', 'hari@example.com', 'securepassword123')

      //Assert - check that create was called with a hashed password
      // not the plain text password
      const createCallArgs = mockUserRepository.prototype.create.mock.calls[0][0]
      expect(createCallArgs.passwordHash).not.toBe('securepassword123')
      expect(createCallArgs.passwordHash).toMatch(/^\$2b\$/)

    })


  })

  describe('login', () => {

    it('should return access token and user info when credentials are valid', async () => {

        const realHash = await bcrypt.hash('correctpassword', 10)
        // Arrange
        mockUserRepository.prototype.findByEmail.mockResolvedValue({
            id: '123',
            name: 'Hari',
            email: 'hari@example.com',
            passwordHash: realHash,
            role: 'DEVELOPER',
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Act
        const result = await authService.login(
            'hari@example.com',
            'correctpassword'
        )

        // Assert
        expect(result).toHaveProperty('accessToken')
        expect(result).toHaveProperty('user')
        expect(result.user).toHaveProperty('id', '123')
        expect(result.user).toHaveProperty('email', 'hari@example.com')
        expect(result.user).not.toHaveProperty('passwordHash')
    })

    it('should throw invalid error when email does not exist', async () => {
        // Arrange
        mockUserRepository.prototype.findByEmail.mockResolvedValue(null)

        // Act and Assert
        await expect(
            authService.login('unknown@example.com', 'somepassword')
        ).rejects.toThrow('Invalid email or password')
    })

    it('should throw invalid error when password is wrong', async () => {

        
        // Arrange
        mockUserRepository.prototype.findByEmail.mockResolvedValue({
            id: '123',
            name: 'Hari',
            email: 'hari@example.com',
            passwordHash: '$2b$10$somehashedpasswordvalue',
            role: 'DEVELOPER',
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Act and Assert
        await expect(
            authService.login('hari@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid email or password')
    })

})

describe('logout', () => {

    it('should delete refresh token from database', async () => {
        // Arrange
        mockUserRepository.prototype.deleteRefreshToken.mockResolvedValue(undefined)

        // Act
        await authService.logout('some-refresh-token')

        // Assert
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
        // Arrange
        const validRefreshToken = jwt.sign(
            { userId: '123' },
            env.jwt.refreshSecret,
            { expiresIn: '7d' }
        )

        mockUserRepository.prototype.findRefreshToken.mockResolvedValue({
            userId: '123',
            token: validRefreshToken
        })

        mockUserRepository.prototype.findById.mockResolvedValue({
            id: '123',
            name: 'Hari',
            email: 'hari@example.com',
            passwordHash: '$2b$10$somehashedpasswordvalue',
            role: 'DEVELOPER',
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Act
        const result = await authService.refresh(validRefreshToken)

        // Assert
        expect(result).toHaveProperty('accessToken')
    })

    it('should throw error when refresh token is invalid', async () => {
        await expect(
            authService.refresh('invalid-token')
        ).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error when refresh token not found in database', async () => {
        // Arrange
        const validRefreshToken = jwt.sign(
            { userId: '123' },
            env.jwt.refreshSecret,
            { expiresIn: '7d' }
        )

        mockUserRepository.prototype.findRefreshToken.mockResolvedValue(null)

        // Act and Assert
        await expect(
            authService.refresh(validRefreshToken)
        ).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error when user no longer exists', async () => {
    // Arrange
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

    // Act and Assert
    await expect(
        authService.refresh(validRefreshToken)
    ).rejects.toThrow('Invalid refresh token')
  })

})

describe('me', () => {

    it('should return user details without passwordHash', async () => {
        // Arrange
        mockUserRepository.prototype.findById.mockResolvedValue({
            id: '123',
            name: 'Hari',
            email: 'hari@example.com',
            passwordHash: '$2b$10$somehashedpasswordvalue',
            role: 'DEVELOPER',
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Act
        const result = await authService.me('123')

        // Assert
        expect(result).toHaveProperty('id', '123')
        expect(result).toHaveProperty('email', 'hari@example.com')
        expect(result).not.toHaveProperty('passwordHash')
    })

    it('should throw error when user not found', async () => {
        // Arrange
        mockUserRepository.prototype.findById.mockResolvedValue(null)

        // Act and Assert
        await expect(
            authService.me('nonexistent-id')
        ).rejects.toThrow('User not found')
    })

})


})
