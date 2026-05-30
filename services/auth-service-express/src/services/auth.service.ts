import bcrypt from 'bcryptjs'
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

}