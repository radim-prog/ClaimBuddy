// Standalone authentication - no external dependencies
// Uses Node.js crypto for password hashing (PBKDF2) and token signing (HMAC)

import crypto from 'crypto'

// ============================================
// CONFIG
// ============================================

const AUTH_SECRET = process.env.AUTH_SECRET || '5ae35f505756d4e50f6e3e37b14ca985c92acaef936f26b708dc85b9e53d4f29'
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
const COOKIE_NAME = 'auth_token'

// ============================================
// USERS
// ============================================

export type UserRole = 'client' | 'accountant' | 'admin' | 'assistant'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  loginName: string // First name for login (case-insensitive)
}

// Pre-computed hash for 'zajcon2026' using PBKDF2
const SHARED_PASSWORD_HASH = '2107435b3243b175d114417eeaa8a753:9a9f242acf2cefe32dc3f49673af1e2eed972087c1a5754c6ef74c777e0c1fdd0c17271603dce91be0be738e53d9ce94fc4df57c2e47922a7c36dfaf87e331f7'

const AUTH_USERS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'user-1-client',
    name: 'Karel Novák',
    email: 'karel@example.com',
    role: 'client',
    loginName: 'karel',
    passwordHash: SHARED_PASSWORD_HASH,
  },
  {
    id: 'user-2-accountant',
    name: 'Jana Svobodová',
    email: 'jana@ucetni.cz',
    role: 'accountant',
    loginName: 'jana',
    passwordHash: SHARED_PASSWORD_HASH,
  },
  {
    id: 'user-3-accountant',
    name: 'Petr Novotný',
    email: 'petr@ucetni.cz',
    role: 'accountant',
    loginName: 'petr',
    passwordHash: SHARED_PASSWORD_HASH,
  },
  {
    id: 'user-4-assistant',
    name: 'Marie Dvořáková',
    email: 'marie@ucetni.cz',
    role: 'assistant',
    loginName: 'marie',
    passwordHash: SHARED_PASSWORD_HASH,
  },
  {
    id: 'user-5-admin',
    name: 'Radim',
    email: 'admin@zajcon.cz',
    role: 'admin',
    loginName: 'radim',
    passwordHash: SHARED_PASSWORD_HASH,
  },
]

// ============================================
// PASSWORD FUNCTIONS
// ============================================

function verifyPassword(password: string, storedHash: string): Promise<boolean> {
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

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(json)
      .digest('base64url')
    if (signature !== expectedSig) return null

    // Decode and check expiry
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
// LOGIN / LOOKUP
// ============================================

export async function authenticate(
  loginName: string,
  password: string
): Promise<{ token: string; user: AuthUser } | null> {
  const user = AUTH_USERS.find(
    u => u.loginName === loginName.toLowerCase().trim()
  )
  if (!user) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role,
  })

  const { passwordHash: _, ...safeUser } = user
  return { token, user: safeUser }
}

export function getRedirectPath(role: UserRole): string {
  return role === 'client' ? '/client/dashboard' : '/accountant/dashboard'
}

export { COOKIE_NAME, TOKEN_MAX_AGE }
