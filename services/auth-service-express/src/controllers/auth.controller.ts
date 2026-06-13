import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { AppError } from '../utils/errors'

export class AuthController {

    private authService: AuthService

    constructor(authService: AuthService) {
        this.authService = authService
    }

    async signup(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body

        try {
            const result = await this.authService.signup(name, email, password)
            res.status(201).json(result)
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body

        try {
            const result = await this.authService.login(email, password)

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })

            res.status(200).json({
                accessToken: result.accessToken,
                user: result.user
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