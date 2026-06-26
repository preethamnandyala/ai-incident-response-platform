import { EmailVerificationService } from '../src/services/email-verification.service'
import { UserRepository } from '../src/repositories/user.repository'
import { hashOTP } from '../src/utils/otp.utils'
import { mockUserRecord } from './fixtures'

jest.mock('../src/repositories/user.repository')

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('EmailVerificationService', () => {

    let emailVerificationService: EmailVerificationService

    beforeEach(() => {
        jest.clearAllMocks()
        emailVerificationService = new EmailVerificationService(new UserRepository())
    })

    describe('sendVerificationOTP', () => {

        it('should generate and save OTP for the user', async () => {
            mockUserRepository.prototype.findById.mockResolvedValue(mockUserRecord)
            mockUserRepository.prototype.saveEmailVerificationOTP.mockResolvedValue(undefined)

            await emailVerificationService.sendVerificationOTP('123')

            expect(mockUserRepository.prototype.saveEmailVerificationOTP)
                .toHaveBeenCalledWith('123', expect.any(String))
        })

        it('should throw when user is not found', async () => {
            mockUserRepository.prototype.findById.mockResolvedValue(null)

            await expect(
                emailVerificationService.sendVerificationOTP('nonexistent')
            ).rejects.toThrow('User not found')
        })

    })

    describe('verifyEmail', () => {

        it('should mark email as verified when OTP is correct', async () => {
            const otp = '123456'
            const otpHash = hashOTP(otp)

            mockUserRepository.prototype.findEmailVerificationOTP.mockResolvedValue({
                otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                usedAt: null
            })
            mockUserRepository.prototype.markEmailVerified.mockResolvedValue(undefined)
            mockUserRepository.prototype.markEmailVerificationOTPUsed.mockResolvedValue(undefined)

            await emailVerificationService.verifyEmail('123', otp)

            expect(mockUserRepository.prototype.markEmailVerified).toHaveBeenCalledWith('123')
            expect(mockUserRepository.prototype.markEmailVerificationOTPUsed).toHaveBeenCalledWith('123')
        })

        it('should throw when OTP record does not exist or expired', async () => {
            mockUserRepository.prototype.findEmailVerificationOTP.mockResolvedValue(null)

            await expect(
                emailVerificationService.verifyEmail('123', '123456')
            ).rejects.toThrow('Invalid or expired OTP')
        })

        it('should throw when OTP does not match', async () => {
            const correctOtpHash = hashOTP('999999')

            mockUserRepository.prototype.findEmailVerificationOTP.mockResolvedValue({
                otpHash: correctOtpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                usedAt: null
            })

            await expect(
                emailVerificationService.verifyEmail('123', '123456')
            ).rejects.toThrow('Invalid or expired OTP')
        })

    })

})