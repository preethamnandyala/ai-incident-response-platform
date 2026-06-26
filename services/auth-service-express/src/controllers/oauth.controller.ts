import { Request, Response } from 'express'
import { LoginResult } from '../services/auth.service'
import { env } from '../config/env'

export class OAuthController {

    async googleCallback(req: Request, res: Response): Promise<void> {
        try {
            const result = req.user as LoginResult

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })

            const redirectUrl = new URL('/auth/callback', env.frontendUrl)
            redirectUrl.searchParams.set('accessToken', result.accessToken)

            res.redirect(redirectUrl.toString())
        } catch (error) {
            const redirectUrl = new URL('/auth/error', env.frontendUrl)
            res.redirect(redirectUrl.toString())
        }
    }

}