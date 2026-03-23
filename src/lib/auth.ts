import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'birthdays-reminder-secret-key-2024'
const SALT_ROUNDS = 12

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Get user from token
export async function getUserFromToken(token: string) {
  const payload = verifyToken(token)
  if (!payload) return null
  
  const user = await db.user.findUnique({
    where: { id: payload.userId }
  })
  
  if (!user || !user.isActive) return null
  
  return user
}

// Initialize default admin user
export async function initializeAdminUser(defaultPassword?: string) {
  const existingAdmin = await db.user.findFirst({
    where: { role: 'admin' }
  })
  
  if (existingAdmin) return existingAdmin
  
  const password = defaultPassword || 'admin123'
  const hashedPassword = await hashPassword(password)
  
  const admin = await db.user.create({
    data: {
      email: 'admin@birthdays.local',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin'
    }
  })
  
  return admin
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需要包含大写字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需要包含小写字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需要包含数字' }
  }
  return { valid: true, message: '密码强度符合要求' }
}
