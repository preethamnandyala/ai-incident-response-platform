import { pool } from '../config/database'
import { UserRole } from '../types/index'

export interface CreateUserData{

  name: string
  email: string
  passwordHash: string
  role: UserRole

}

export interface UserRecord {

    id: string
    name: string
    email: string
    passwordHash: string
    role: string
    createdAt: Date
    updatedAt: Date


}

export class UserRepository {

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      'SELECT id, name, email, password_hash as "passwordHash", role, created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE email = $1',
        [email]
    )
    if (result.rows.length === 0){
      return null
    }
    return result.rows[0]
  }

  async create(data: CreateUserData): Promise<UserRecord> {

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at`, [data.name, data.email, data.passwordHash, data.role]
    )
    return result.rows[0]

  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [userId, token]
    )
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await pool.query(
        `SELECT id, name, email, 
         password_hash as "passwordHash", 
         role, 
         created_at as "createdAt", 
         updated_at as "updatedAt" 
         FROM users WHERE id = $1`,
        [id]
    )
    if (result.rows.length === 0) {
        return null
    }
    return result.rows[0]
  }

  async findRefreshToken(token: string): Promise<{ userId: string, token: string } | null> {
    const result = await pool.query(
        `SELECT user_id as "userId", token 
         FROM refresh_tokens 
         WHERE token = $1 AND expires_at > NOW()`,
        [token]
    )
    if (result.rows.length === 0) {
        return null
    }
    return result.rows[0]
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [token]
    )
  }

}