import  {pool} from '../config/database'

export interface UserRecord {
    id: string
    name: string
    email: string
    passwordHash: string
    role: string
    emailVerified: boolean
    googleId: string | null
    organizationId: string
    createdAt: Date
    updatedAt: Date
}

export class UserRepository {

    async findByEmail(email: string): Promise<UserRecord | null> {
        const result = await pool.query(
            `SELECT id, name, email,
             password_hash as "passwordHash",
             role,
             email_verified as "emailVerified",
             google_id as "googleId",
             organization_id as "organizationId",
             created_at as "createdAt",
             updated_at as "updatedAt"
             FROM users WHERE email = $1`,
            [email]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async findById(id: string): Promise<UserRecord | null> {
        const result = await pool.query(
            `SELECT id, name, email,
             password_hash as "passwordHash",
             role,
             email_verified as "emailVerified",
             google_id as "googleId",
             organization_id as "organizationId",
             created_at as "createdAt",
             updated_at as "updatedAt"
             FROM users WHERE id = $1`,
            [id]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async create(userData: {
        name: string
        email: string
        passwordHash: string
        role: string
    }): Promise<UserRecord> {
        const result = await pool.query(
            `INSERT INTO users
             (name, email, password_hash, role, organization_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email,
             password_hash as "passwordHash",
             role,
             email_verified as "emailVerified",
             google_id as "googleId",
             organization_id as "organizationId",
             created_at as "createdAt",
             updated_at as "updatedAt"`,
            [userData.name, userData.email,
             userData.passwordHash, userData.role, 'org_default']
        )
        return result.rows[0]
    }

    async saveRefreshToken(
        userId: string,
        token: string
    ): Promise<void> {
        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token)
             VALUES ($1, $2)
             ON CONFLICT (token) DO NOTHING`,
            [userId, token]
        )
    }

    async findRefreshToken(
        token: string
    ): Promise<{ userId: string, token: string } | null> {
        const result = await pool.query(
            `SELECT user_id as "userId", token
             FROM refresh_tokens WHERE token = $1`,
            [token]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async deleteRefreshToken(token: string): Promise<void> {
        await pool.query(
            'DELETE FROM refresh_tokens WHERE token = $1',
            [token]
        )
    }

    async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
        await pool.query(
            'DELETE FROM refresh_tokens WHERE user_id = $1',
            [userId]
        )
    }

    async findByGoogleId(googleId: string): Promise<UserRecord | null> {
        const result = await pool.query(
            `SELECT id, name, email,
             password_hash as "passwordHash",
             role,
             email_verified as "emailVerified",
             google_id as "googleId",
             organization_id as "organizationId",
             created_at as "createdAt",
             updated_at as "updatedAt"
             FROM users WHERE google_id = $1`,
            [googleId]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async linkGoogleAccount(
        userId: string,
        googleId: string
    ): Promise<void> {
        await pool.query(
            `UPDATE users SET google_id = $1, updated_at = NOW()
             WHERE id = $2`,
            [googleId, userId]
        )
    }

    async createGoogleUser(
        name: string,
        email: string,
        googleId: string
    ): Promise<UserRecord> {
        const result = await pool.query(
            `INSERT INTO users
             (name, email, password_hash, role,
              email_verified, google_id, organization_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email,
             password_hash as "passwordHash",
             role,
             email_verified as "emailVerified",
             google_id as "googleId",
             organization_id as "organizationId",
             created_at as "createdAt",
             updated_at as "updatedAt"`,
            [name, email, '', 'DEVELOPER', true, googleId, 'org_default']
        )
        return result.rows[0]
    }

    async saveEmailVerificationOTP(
        userId: string,
        otpHash: string
    ): Promise<void> {
        await pool.query(
            'DELETE FROM email_verification_otps WHERE user_id = $1',
            [userId]
        )
        await pool.query(
            `INSERT INTO email_verification_otps
             (user_id, otp_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [userId, otpHash]
        )
    }

    async findEmailVerificationOTP(
        userId: string
    ): Promise<{ otpHash: string, expiresAt: Date, usedAt: Date | null } | null> {
        const result = await pool.query(
            `SELECT otp_hash as "otpHash",
             expires_at as "expiresAt",
             used_at as "usedAt"
             FROM email_verification_otps
             WHERE user_id = $1
             AND expires_at > NOW()
             AND used_at IS NULL`,
            [userId]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async markEmailVerificationOTPUsed(userId: string): Promise<void> {
        await pool.query(
            `UPDATE email_verification_otps
             SET used_at = NOW()
             WHERE user_id = $1`,
            [userId]
        )
    }

    async markEmailVerified(userId: string): Promise<void> {
        await pool.query(
            `UPDATE users SET email_verified = true, updated_at = NOW()
             WHERE id = $1`,
            [userId]
        )
    }

    async savePasswordResetOTP(
        userId: string,
        otpHash: string
    ): Promise<void> {
        await pool.query(
            'DELETE FROM password_reset_otps WHERE user_id = $1',
            [userId]
        )
        await pool.query(
            `INSERT INTO password_reset_otps
             (user_id, otp_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [userId, otpHash]
        )
    }

    async findPasswordResetOTP(
        userId: string
    ): Promise<{ otpHash: string, expiresAt: Date, usedAt: Date | null } | null> {
        const result = await pool.query(
            `SELECT otp_hash as "otpHash",
             expires_at as "expiresAt",
             used_at as "usedAt"
             FROM password_reset_otps
             WHERE user_id = $1
             AND expires_at > NOW()
             AND used_at IS NULL`,
            [userId]
        )
        if (result.rows.length === 0) return null
        return result.rows[0]
    }

    async markPasswordResetOTPUsed(userId: string): Promise<void> {
        await pool.query(
            `UPDATE password_reset_otps
             SET used_at = NOW()
             WHERE user_id = $1`,
            [userId]
        )
    }

    async updatePassword(
        userId: string,
        passwordHash: string
    ): Promise<void> {
        await pool.query(
            `UPDATE users
             SET password_hash = $1, updated_at = NOW()
             WHERE id = $2`,
            [passwordHash, userId]
        )
    }
}