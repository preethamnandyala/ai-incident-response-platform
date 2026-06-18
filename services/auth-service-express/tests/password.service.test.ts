import { PasswordService } from '../src/services/password.service'
import { UserRepository } from '../src/repositories/user.repository'

jest.mock('../src/repositories/user.repository')

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('PasswordService', () => {

    let passwordService: PasswordService

    beforeEach(() => {
        jest.clearAllMocks()
        passwordService = new PasswordService(new UserRepository())
    })

    describe('forgotPassword', () => {

        it('should generate and save OTP when email exists', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue({
                id: '123',
                name: 'Hari',
                email: 'hari@example.com',
                passwordHash: '$2b$10$somehash',
                role: 'DEVELOPER',
                createdAt: new Date(),
                updatedAt: new Date()
            })
            mockUserRepository.prototype.savePasswordResetOTP.mockResolvedValue(undefined)

            await passwordService.forgotPassword('hari@example.com')

            expect(mockUserRepository.prototype.savePasswordResetOTP)
                .toHaveBeenCalledWith('123', expect.any(String))
        })

        it('should complete without error and not save OTP when email does not exist', async () => {
            mockUserRepository.prototype.findByEmail.mockResolvedValue(null)

            await expect(
                passwordService.forgotPassword('fake@example.com')
            ).resolves.not.toThrow()

            expect(mockUserRepository.prototype.savePasswordResetOTP)
                .not.toHaveBeenCalled()
        })

    })

})