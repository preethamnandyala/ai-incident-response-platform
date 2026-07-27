import bcrypt from 'bcryptjs'
import  jwt  from 'jsonwebtoken'
import { env } from '../config/env'
import { UserRepository } from '../repositories/user.repository'
import { UserRole } from '../types/index'
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors'

export interface SignupResult{

  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface LoginResult {
    accessToken: string
    refreshToken: string
    user: {
        id: string
        name: string
        email: string
        role: UserRole
    }
}

export class AuthService{

  private userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async signup(
    name: string,
    email: string,
    password: string
  ): Promise<SignupResult> {

    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new ConflictError('Email already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await this.userRepository.create({
      name,
      email,
      passwordHash,
      role: UserRole.DEVELOPER
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  async login(
    email: string,
    password: string
): Promise<LoginResult> {

    // Find user by email
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
        throw new UnauthorizedError('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password')
    }

    // Generate access token
    const accessToken = jwt.sign(
    {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry as '15m' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
        { userId: user.id },
        env.jwt.refreshSecret,
        { expiresIn: env.jwt.refreshExpiry as '7d' }
    )

    // Store refresh token in database
    await this.userRepository.saveRefreshToken(user.id, refreshToken)

    // Return result — controller will set refreshToken as HTTP-only cookie
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

 async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
        throw new BadRequestError('Refresh token is required')
    }

    await this.userRepository.deleteRefreshToken(refreshToken)
}

async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify JWT signature first
    let payload: { userId: string }
    try {
        payload = jwt.verify(
            refreshToken,
            env.jwt.refreshSecret
        ) as { userId: string }
    } catch {
        throw new UnauthorizedError('Invalid refresh token')
    }

    // Check token exists in database
    const storedToken = await this.userRepository.findRefreshToken(refreshToken)
    if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token')
    }

    // Find user
    const user = await this.userRepository.findById(payload.userId)
    if (!user) {
        throw new UnauthorizedError('Invalid refresh token')
    }

    // Generate new access token
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role, organizationId: user.organizationId },
        env.jwt.accessSecret,
        { expiresIn: env.jwt.accessExpiry as '15m' }
    )

    return { accessToken }
}

async me(userId: string): Promise<SignupResult> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
        throw new NotFoundError('User not found')
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
}
}
