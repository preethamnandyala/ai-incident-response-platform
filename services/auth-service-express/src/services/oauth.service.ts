import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user.repository'
import { LoginResult } from './auth.service'
import { ConflictError } from '../utils/errors'
import { env } from '../config/env'
import { UserRole } from '../types/index'

export class OAuthService {

    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async handleGoogleCallback(
        googleId: string,
        email: string,
        name: string
    ): Promise<LoginResult> {

        // Check if user already has Google linked
        let user = await this.userRepository.findByGoogleId(googleId)

        if (!user) {
            // Check if email exists
            const existingUser = await this.userRepository.findByEmail(email)

            if (existingUser) {
                // Email exists — check verification status
                if (!existingUser.emailVerified) {
                    throw new ConflictError(
                        'Please verify your email before linking your Google account'
                    )
                }
                // Email verified — link Google account
                await this.userRepository.linkGoogleAccount(existingUser.id, googleId)
                user = existingUser
            } else {
                // No account — create new Google user
                user = await this.userRepository.createGoogleUser(name, email, googleId)
            }
        }

        // Generate tokens — same as normal login
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            env.jwt.accessSecret,
            { expiresIn: env.jwt.accessExpiry as '15m' }
        )

        const refreshToken = jwt.sign(
            { userId: user.id },
            env.jwt.refreshSecret,
            { expiresIn: env.jwt.refreshExpiry as '7d' }
        )

        await this.userRepository.saveRefreshToken(user.id, refreshToken)

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole
            }
        }
    }

}