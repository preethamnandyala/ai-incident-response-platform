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
  role: string
  createdAt: Date
  updatedAt: Date


}

export class UserRepository {

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at FROM users WHERE email = $1`,[email]
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

}