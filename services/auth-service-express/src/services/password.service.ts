import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user.repository'
import { generateOTP, hashOTP, compareOTP } from '../utils/otp.utils'
import { UnauthorizedError } from '../utils/errors'


export class PasswordService {

    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email)

        if (user) {
            const otp = generateOTP()
            const otpHash = hashOTP(otp)

            await this.userRepository.savePasswordResetOTP(user.id, otpHash)

            // Email sending is a placeholder until Phase 9
            console.log(`[DEV ONLY] OTP for ${user.email}: ${otp}`)
        }

        // Always completes successfully regardless of whether user exists
    }

    async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email)
        if (!user) {
            throw new UnauthorizedError('Invalid or expired OTP')
        }

        const otpRecord = await this.userRepository.findPasswordResetOTP(user.id)
        if (!otpRecord) {
            throw new UnauthorizedError('Invalid or expired OTP')
        }

        const isOtpValid = compareOTP(otp, otpRecord.otpHash)
        if (!isOtpValid) {
            throw new UnauthorizedError('Invalid or expired OTP')
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10)
        await this.userRepository.updatePassword(user.id, newPasswordHash)
        await this.userRepository.markPasswordResetOTPUsed(user.id)
        await this.userRepository.deleteAllRefreshTokensForUser(user.id)
    }

}