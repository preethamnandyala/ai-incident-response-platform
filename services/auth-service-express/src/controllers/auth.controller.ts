import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { handleControllerError } from '../utils/errors'
import { EmailVerificationService } from '../services/email-verification.service'


export class AuthController {

    private authService: AuthService
    private emailVerificationService: EmailVerificationService

    constructor(authService: AuthService, emailVerificationService: EmailVerificationService) {
        this.authService = authService
        this.emailVerificationService = emailVerificationService
    }

    async signup(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body

        try {
            const result = await this.authService.signup(name, email, password)

             await this.emailVerificationService.sendVerificationOTP(result.id)

            res.status(201).json(result)
        } catch (error) {
            handleControllerError(error, res)
        }
    }

    async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body
    try {
        const result = await this.authService.login(email, password)
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({
            accessToken: result.accessToken,
            user: result.user
        })
    } catch (error) {
        handleControllerError(error, res)
    }
}

async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken
    try {
        await this.authService.logout(refreshToken)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
        handleControllerError(error, res)
    }
}

    async refresh(req: Request, res: Response): Promise<void> {
        const refreshToken = req.cookies?.refreshToken

        try {
            const result = await this.authService.refresh(refreshToken)

            res.status(200).json({ accessToken: result.accessToken })
        } catch (error) {
            handleControllerError(error, res)
        }
    }

    async me(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId

        try {
            const result = await this.authService.me(userId)

            res.status(200).json(result)
        } catch (error) {
            handleControllerError(error, res)
        }
    }

}