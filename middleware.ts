import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Inline constants (can't import Node.js crypto modules in Edge Runtime)
const COOKIE_NAME = 'auth_token'
const AUTH_SECRET = process.env.AUTH_SECRET
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required and must not be empty')
}

const PUBLIC_EXACT = ['/', '/ucetni']  // Exact match only (startsWith '/' would match everything)
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/logout', '/api/health', '/api/stripe/webhook', '/api/cron/drive-sync']
const STATIC_PREFIXES = ['/_next', '/static', '/favicon.ico']

// --- Rate Limiting (in-memory, sliding window) ---
const RATE_LIMITS = {
  login: { window: 60_000, max: 5 },   // 5 login attempts per minute
  api:   { window: 60_000, max: 60 },   // 60 API calls per minute
} as const

const hits = new Map<string, number[]>()

// Clean up old entries every 5 minutes
let lastCleanup = Date.now()
function cleanupHits() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return
  lastCleanup = now
  const cutoff = now - 120_000
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter(t => t > cutoff)
    if (filtered.length === 0) hits.delete(key)
    else hits.set(key, filtered)
  }
}

function isRateLimited(key: string, limit: { window: number; max: number }): boolean {
  cleanupHits()
  const now = Date.now()
  const timestamps = hits.get(key) || []
  const recent = timestamps.filter(t => now - t < limit.window)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > limit.max
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

// Token verification using Web Crypto API (Edge Runtime compatible)
interface TokenPayload {
  id: string
  name: string
  role: string
  plan?: string
  exp: number
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const dotIndex = token.indexOf('.')
    if (dotIndex === -1) return null
    const json = token.substring(0, dotIndex)
    const signature = token.substring(dotIndex + 1)

    // Verify HMAC signature using Web Crypto API
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(json))
    const expectedSig = base64UrlEncode(sigBuffer)

    // Constant-time comparison (Edge Runtime - no crypto.timingSafeEqual)
    if (signature.length !== expectedSig.length) return null
    const encoder2 = new TextEncoder()
    const a = encoder2.encode(signature)
    const b = encoder2.encode(expectedSig)
    let diff = 0
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i]
    }
    if (diff !== 0) return null

    // Decode payload
    const decoded = atob(json.replace(/-/g, '+').replace(/_/g, '/'))
    const payload: TokenPayload = JSON.parse(decoded)

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets
  if (STATIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)) {
    return NextResponse.next()
  }

  // Landing pages (/ and /ucetni): logged-in users → redirect to dashboard
  if (PUBLIC_EXACT.includes(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const user = await verifyToken(token)
      if (user) {
        const dest = user.role === 'client' ? '/client/dashboard' : '/accountant/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }
    }
    return NextResponse.next()
  }

  // Allow public paths (but rate limit login)
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (pathname === '/api/auth/login' && request.method === 'POST') {
      const ip = getClientIp(request)
      if (isRateLimited(`login:${ip}`, RATE_LIMITS.login)) {
        return NextResponse.json(
          { error: 'Příliš mnoho pokusů o přihlášení. Zkuste to za minutu.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
    }
    return NextResponse.next()
  }

  // General API rate limit
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    if (isRateLimited(`api:${ip}`, RATE_LIMITS.api)) {
      return NextResponse.json(
        { error: 'Příliš mnoho požadavků. Zkuste to později.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // Check auth token
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return handleUnauthenticated(request, pathname)
  }

  const user = await verifyToken(token)

  if (!user) {
    const response = handleUnauthenticated(request, pathname)
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  // Role-based access control
  if (pathname.startsWith('/accountant') || pathname.startsWith('/api/accountant')) {
    if (user.role !== 'accountant' && user.role !== 'admin' && user.role !== 'assistant') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/client/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/client') || pathname.startsWith('/api/client')) {
    const impersonateCompany = request.cookies.get('impersonate_company')?.value
    const isImpersonating = impersonateCompany && ['accountant', 'admin', 'assistant'].includes(user.role)

    if (!isImpersonating && user.role !== 'client' && user.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/accountant/dashboard', request.url))
    }

  }

  // Add user info to headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-name', user.name)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-plan', user.plan || 'free')

  // Forward impersonation context if active
  const impersonateCookie = request.cookies.get('impersonate_company')?.value
  if (impersonateCookie && ['accountant', 'admin', 'assistant'].includes(user.role)) {
    requestHeaders.set('x-impersonate-company', impersonateCookie)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

function handleUnauthenticated(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Smart redirect: accountant paths → /ucetni, everything else → / (client landing)
  const dest = pathname.startsWith('/accountant') || pathname.startsWith('/api/accountant')
    ? '/ucetni'
    : '/'
  return NextResponse.redirect(new URL(dest, request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
