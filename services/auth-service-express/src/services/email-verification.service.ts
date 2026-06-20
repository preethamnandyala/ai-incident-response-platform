import { UserRepository } from '../repositories/user.repository'
import { generateOTP, hashOTP, compareOTP } from '../utils/otp.utils'
import { UnauthorizedError, NotFoundError } from '../utils/errors'

export class EmailVerificationService {

    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async sendVerificationOTP(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const otp = generateOTP()
        const otpHash = hashOTP(otp)

        await this.userRepository.saveEmailVerificationOTP(userId, otpHash)

        console.log(`[DEV ONLY] Email verification OTP for ${user.email}: ${otp}`)
    }

    async verifyEmail(userId: string, otp: string): Promise<void> {
        const otpRecord = await this.userRepository.findEmailVerificationOTP(userId)
        if (!otpRecord) {
            throw new UnauthorizedError('Invalid or expired OTP')
        }

        const isOtpValid = compareOTP(otp, otpRecord.otpHash)
        if (!isOtpValid) {
            throw new UnauthorizedError('Invalid or expired OTP')
        }

        await this.userRepository.markEmailVerified(userId)
        await this.userRepository.markEmailVerificationOTPUsed(userId)
    }

}