import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { env } from './env'
import { OAuthService } from '../services/oauth.service'
import { UserRepository } from '../repositories/user.repository'

const userRepository = new UserRepository()
const oauthService = new OAuthService(userRepository)

passport.use(new GoogleStrategy(
    {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value
            const name = profile.displayName
            const googleId = profile.id

            if (!email) {
                return done(new Error('No email found in Google profile'), undefined)
            }

            const result = await oauthService.handleGoogleCallback(
                googleId,
                email,
                name
            )

            return done(null, result)
        } catch (error) {
            return done(error as Error, undefined)
        }
    }
))

export default passport