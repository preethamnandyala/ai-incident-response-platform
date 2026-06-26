import { Router, Request, Response } from 'express'
import passport from '../config/passport'
import { OAuthController } from '../controllers/oauth.controller'
import { env } from '../config/env'

const oauthController = new OAuthController()
const router = Router()

router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
)

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${env.frontendUrl}/auth/error`
    }),
    (req: Request, res: Response) => oauthController.googleCallback(req, res)
)

export default router