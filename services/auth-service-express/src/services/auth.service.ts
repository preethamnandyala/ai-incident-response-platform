import bcrypt from 'bcryptjs'
import  jwt  from 'jsonwebtoken'
import { env } from '../config/env'
import { UserRepository } from '../repositories/user.repository'
import { UserRole } from '../types/index'

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
      throw new Error('Email already exists')
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
        throw new Error('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
        throw new Error('Invalid email or password')
    }

    // Generate access token
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
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
}
