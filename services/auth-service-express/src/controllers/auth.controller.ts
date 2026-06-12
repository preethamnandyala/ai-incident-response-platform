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

}