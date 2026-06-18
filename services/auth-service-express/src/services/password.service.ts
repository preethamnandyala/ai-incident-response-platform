import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user.repository'
import { generateOTP, hashOTP, compareOTP } from '../utils/otp.utils'
import { BadRequestError, UnauthorizedError } from '../utils/errors'

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

}