import { PasswordService } from '../src/services/password.service'
import { UserRepository } from '../src/repositories/user.repository'
import { hashOTP } from '../src/utils/otp.utils'
import bcrypt from 'bcryptjs'

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

  describe('resetPassword', () => {

      it('should reset password when email and OTP are valid', async () => {
          const otp = '123456'
          const otpHash = hashOTP(otp)

          mockUserRepository.prototype.findByEmail.mockResolvedValue({
              id: '123',
              name: 'Hari',
              email: 'hari@example.com',
              passwordHash: '$2b$10$oldhash',
              role: 'DEVELOPER',
              createdAt: new Date(),
              updatedAt: new Date()
          })
          mockUserRepository.prototype.findPasswordResetOTP.mockResolvedValue({
              otpHash,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
              usedAt: null
          })
          mockUserRepository.prototype.updatePassword.mockResolvedValue(undefined)
          mockUserRepository.prototype.markPasswordResetOTPUsed.mockResolvedValue(undefined)
          mockUserRepository.prototype.deleteAllRefreshTokensForUser.mockResolvedValue(undefined)

          await passwordService.resetPassword('hari@example.com', otp, 'NewSecurePass1!')

          expect(mockUserRepository.prototype.updatePassword).toHaveBeenCalledWith(
              '123',
              expect.any(String)
          )
          expect(mockUserRepository.prototype.markPasswordResetOTPUsed).toHaveBeenCalledWith('123')
          expect(mockUserRepository.prototype.deleteAllRefreshTokensForUser).toHaveBeenCalledWith('123')
      })

      it('should throw when email does not exist', async () => {
          mockUserRepository.prototype.findByEmail.mockResolvedValue(null)

          await expect(
              passwordService.resetPassword('fake@example.com', '123456', 'NewSecurePass1!')
          ).rejects.toThrow('Invalid or expired OTP')
      })

      it('should throw when OTP record does not exist or expired', async () => {
          mockUserRepository.prototype.findByEmail.mockResolvedValue({
              id: '123',
              name: 'Hari',
              email: 'hari@example.com',
              passwordHash: '$2b$10$oldhash',
              role: 'DEVELOPER',
              createdAt: new Date(),
              updatedAt: new Date()
          })
          mockUserRepository.prototype.findPasswordResetOTP.mockResolvedValue(null)

          await expect(
              passwordService.resetPassword('hari@example.com', '123456', 'NewSecurePass1!')
          ).rejects.toThrow('Invalid or expired OTP')
      })

      it('should throw when OTP does not match', async () => {
          const correctOtpHash = hashOTP('999999')

          mockUserRepository.prototype.findByEmail.mockResolvedValue({
              id: '123',
              name: 'Hari',
              email: 'hari@example.com',
              passwordHash: '$2b$10$oldhash',
              role: 'DEVELOPER',
              createdAt: new Date(),
              updatedAt: new Date()
          })
          mockUserRepository.prototype.findPasswordResetOTP.mockResolvedValue({
              otpHash: correctOtpHash,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
              usedAt: null
          })

          await expect(
              passwordService.resetPassword('hari@example.com', '123456', 'NewSecurePass1!')
          ).rejects.toThrow('Invalid or expired OTP')
      })

  })

    describe('changePassword', () => {

        it('should update password when old password is correct', async () => {
            const oldPasswordHash = await bcrypt.hash('OldSecurePass1!', 10)

            mockUserRepository.prototype.findById.mockResolvedValue({
                id: '123',
                name: 'Hari',
                email: 'hari@example.com',
                passwordHash: oldPasswordHash,
                role: 'DEVELOPER',
                createdAt: new Date(),
                updatedAt: new Date()
            })
            mockUserRepository.prototype.updatePassword.mockResolvedValue(undefined)
            mockUserRepository.prototype.deleteAllRefreshTokensForUser.mockResolvedValue(undefined)

            await passwordService.changePassword('123', 'OldSecurePass1!', 'NewSecurePass1!')

            expect(mockUserRepository.prototype.updatePassword).toHaveBeenCalledWith(
                '123',
                expect.any(String)
            )
            expect(mockUserRepository.prototype.deleteAllRefreshTokensForUser)
                .toHaveBeenCalledWith('123')
        })

        it('should throw when user is not found', async () => {
            mockUserRepository.prototype.findById.mockResolvedValue(null)

            await expect(
                passwordService.changePassword('nonexistent', 'OldSecurePass1!', 'NewSecurePass1!')
            ).rejects.toThrow('Current password is incorrect')
        })

        it('should throw when old password is incorrect', async () => {
            const oldPasswordHash = await bcrypt.hash('OldSecurePass1!', 10)

            mockUserRepository.prototype.findById.mockResolvedValue({
                id: '123',
                name: 'Hari',
                email: 'hari@example.com',
                passwordHash: oldPasswordHash,
                role: 'DEVELOPER',
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(
                passwordService.changePassword('123', 'WrongOldPassword1!', 'NewSecurePass1!')
            ).rejects.toThrow('Current password is incorrect')
        })

    })

})