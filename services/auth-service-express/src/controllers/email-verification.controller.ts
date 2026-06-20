import { Request, Response } from 'express'
import { EmailVerificationService } from '../services/email-verification.service'
import { AppError } from '../utils/errors'

export class EmailVerificationController {

    private emailVerificationService: EmailVerificationService

    constructor(emailVerificationService: EmailVerificationService) {
        this.emailVerificationService = emailVerificationService
    }

    async verifyEmail(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId
        const { otp } = req.body

        try {
            await this.emailVerificationService.verifyEmail(userId, otp)

            res.status(200).json({ message: 'Email verified successfully' })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

    async resendVerificationOTP(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId

        try {
            await this.emailVerificationService.sendVerificationOTP(userId)

            res.status(200).json({ message: 'Verification OTP sent' })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

}