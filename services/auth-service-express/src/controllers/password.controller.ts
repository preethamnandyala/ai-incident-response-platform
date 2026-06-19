import { Request, Response } from 'express'
import { PasswordService } from '../services/password.service'
import { AppError } from '../utils/errors'

export class PasswordController {

    private passwordService: PasswordService

    constructor(passwordService: PasswordService) {
        this.passwordService = passwordService
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        const { email } = req.body

        try {
            await this.passwordService.forgotPassword(email)

            res.status(200).json({
                message: 'If an account exists with this email, an OTP has been sent'
            })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        const { email, otp, newPassword } = req.body

        try {
            await this.passwordService.resetPassword(email, otp, newPassword)

            res.status(200).json({
                message: 'Password reset successfully'
            })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId
        const { oldPassword, newPassword } = req.body

        try {
            await this.passwordService.changePassword(userId, oldPassword, newPassword)

            res.status(200).json({
                message: 'Password changed successfully'
            })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

}