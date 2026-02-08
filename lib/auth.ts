// Authentication module
// Uses Node.js crypto for password hashing (PBKDF2) and token signing (HMAC)
// User storage: Supabase PostgreSQL (via lib/user-store.ts)

import crypto from 'crypto'
import { getUserByLoginName } from '@/lib/user-store'

// ============================================
// CONFIG
// ============================================

const AUTH_SECRET = process.env.AUTH_SECRET || '5ae35f505756d4e50f6e3e37b14ca985c92acaef936f26b708dc85b9e53d4f29'
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
const COOKIE_NAME = 'auth_token'

// ============================================
// TYPES
// ============================================

export type UserRole = 'client' | 'accountant' | 'admin' | 'assistant'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  login_name: string
}

// ============================================
// PASSWORD FUNCTIONS
// ============================================

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) return reject(err)
      resolve(`${salt}:${key.toString('hex')}`)
    })
  })
}

export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(':')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) return reject(err)
      resolve(key.toString('hex') === hash)
    })
  })
}

// ============================================
// TOKEN FUNCTIONS (HMAC-signed JSON)
// ============================================

export interface TokenPayload {
  id: string
  name: string
  role: UserRole
  exp: number
}

function createToken(payload: Omit<TokenPayload, 'exp'>): string {
  const data: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE,
  }
  const json = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(json)
    .digest('base64url')
  return `${json}.${signature}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [json, signature] = token.split('.')
    if (!json || !signature) return null

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(json)
      .digest('base64url')
    if (signature !== expectedSig) return null

    const payload: TokenPayload = JSON.parse(
      Buffer.from(json, 'base64url').toString()
    )
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ============================================
// LOGIN
// ============================================

export async function authenticate(
  loginName: string,
  password: string
): Promise<{ token: string; user: AuthUser } | null> {
  const user = await getUserByLoginName(loginName)
  if (!user) return null

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return null

  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role,
  })

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      login_name: user.login_name,
    },
  }
}

export function getRedirectPath(role: UserRole): string {
  return role === 'client' ? '/client/dashboard' : '/accountant/dashboard'
}

export { COOKIE_NAME, TOKEN_MAX_AGE }
