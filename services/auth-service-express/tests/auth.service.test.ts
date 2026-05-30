import { AuthService } from '../src/services/auth.service'
import { UserRepository } from '../src/repositories/user.repository'

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


})
