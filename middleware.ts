import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Inline constants (can't import Node.js crypto modules in Edge Runtime)
const COOKIE_NAME = 'auth_token'
const AUTH_SECRET = process.env.AUTH_SECRET
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required and must not be empty')
}

const PUBLIC_EXACT = ['/', '/ucetni', '/claims']  // Exact match only (startsWith '/' would match everything)
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-sent', '/api/auth/verify', '/pricing', '/marketplace', '/legal', '/pro-ucetni', '/pro-podnikatele', '/o-nas', '/funkce', '/claims/new', '/design-variants', '/api/leads', '/api/marketplace', '/api/auth/login', '/api/auth/logout', '/api/health', '/api/stripe/webhook', '/api/setup/first-admin', '/api/cron/drive-sync', '/api/cron/trial-expiry', '/api/cron/credits-reset', '/api/cron/fetch-emails', '/api/cron/fetch-document-emails', '/api/cron/lead-emails', '/api/cron/purge-trash', '/api/cron/sync-ecomail-contacts', '/api/cron/raynet-sync', '/api/cron/health-scores', '/api/cron/generate-notifications', '/api/cron/notion-sync', '/api/cron/reminders', '/api/cron/invoice-reminders', '/api/cron/billing', '/api/cron/snapshots', '/api/cron/calculate-penalties', '/api/cron/auto-reports', '/api/cron/account-cleanup', '/api/client/account/cancel-deletion', '/auth/cancel-deletion', '/api/signing/webhook', '/api/bridge', '/api/claims/intake', '/api/claims/companies']
const STATIC_PREFIXES = ['/_next', '/static', '/favicon.ico']

// Claims hostname URL rewrites: clean URL → internal path
const CLAIMS_REWRITES: Record<string, string> = {
  '/dashboard': '/accountant/claims/dashboard',
  '/cases': '/accountant/claims/cases',
  '/insurers': '/accountant/claims/insurers',
  '/stats': '/accountant/claims/stats',
  '/settings': '/accountant/claims/settings',
  '/clients': '/accountant/clients',
  '/komunikace': '/accountant/komunikace',
}

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
  modules?: string[]
  firm_id?: string | null
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
    const a = encoder.encode(signature)
    const b = encoder.encode(expectedSig)
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

async function verifySignedCookie(signedValue: string): Promise<string | null> {
  const dotIndex = signedValue.lastIndexOf('.')
  if (dotIndex === -1) return null
  const value = signedValue.substring(0, dotIndex)
  const signature = signedValue.substring(dotIndex + 1)
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
    const expectedHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    if (signature.length !== expectedHex.length) return null
    const a = encoder.encode(signature)
    const b = encoder.encode(expectedHex)
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
    return diff === 0 ? value : null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host')?.split(':')[0] || ''

  // Allow static assets
  if (STATIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)) {
    return NextResponse.next()
  }

  // Host-based routing: claims.zajcon.cz → clean URLs
  if (hostname === 'claims.zajcon.cz') {
    // Root → check auth first to avoid redirect loop
    if (pathname === '/' || pathname === '') {
      const token = request.cookies.get(COOKIE_NAME)?.value
      if (token) {
        const user = await verifyToken(token)
        if (user) {
          const dest = user.role === 'client' ? '/client/claims' : '/dashboard'
          return NextResponse.redirect(new URL(dest, request.url))
        }
      }
      const url = request.nextUrl.clone()
      url.pathname = '/claims'
      return NextResponse.rewrite(url)
    }
    // Clean URL rewrites: /dashboard → /accountant/claims/dashboard, etc.
    if (CLAIMS_REWRITES[pathname]) {
      const url = request.nextUrl.clone()
      url.pathname = CLAIMS_REWRITES[pathname]
      return NextResponse.rewrite(url)
    }
    // Redirect old full paths to clean URLs on claims hostname
    for (const [clean, internal] of Object.entries(CLAIMS_REWRITES)) {
      if (pathname === internal) {
        return NextResponse.redirect(new URL(clean, request.url))
      }
    }
    // Standard dashboards → claims clean URLs
    if (pathname === '/client/dashboard') {
      return NextResponse.redirect(new URL('/client/claims', request.url))
    }
    if (pathname === '/accountant/dashboard') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // /auth, /api, /claims, /accountant, /client paths stay as-is
    // Everything else → redirect to clean /dashboard
    if (!pathname.startsWith('/claims') && !pathname.startsWith('/accountant') && !pathname.startsWith('/client') && !pathname.startsWith('/api') && !pathname.startsWith('/auth') && !pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Landing pages (/ and /ucetni and /claims): logged-in users → redirect to dashboard
  if (PUBLIC_EXACT.includes(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const user = await verifyToken(token)
      if (user) {
        if (pathname === '/claims') {
          // Claims landing: logged-in staff → claims dashboard, client → client claims
          if (user.role === 'client') {
            return NextResponse.redirect(new URL('/client/claims', request.url))
          }
          const modules = user.modules || ['accounting']
          if (modules.includes('claims')) {
            return NextResponse.redirect(new URL('/accountant/claims/dashboard', request.url))
          }
        }
        // Default: claims hostname clients → /client/claims, otherwise /client/dashboard
        if (user.role === 'client') {
          const dest = hostname === 'claims.zajcon.cz' ? '/client/claims' : '/client/dashboard'
          return NextResponse.redirect(new URL(dest, request.url))
        }
        return NextResponse.redirect(new URL('/accountant/dashboard', request.url))
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
    if (user.role !== 'accountant' && user.role !== 'admin' && user.role !== 'assistant' && user.role !== 'junior' && user.role !== 'senior') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/client/dashboard', request.url))
    }
  }

  const rawImpersonate = request.cookies.get('impersonate_company')?.value
  const isStaffRole = ['junior', 'senior', 'accountant', 'admin', 'assistant'].includes(user.role)
  let impersonateCompany: string | undefined
  if (rawImpersonate && isStaffRole) {
    impersonateCompany = await verifySignedCookie(rawImpersonate) || undefined
  }
  const isImpersonating = !!impersonateCompany

  // User impersonation (admin-only)
  const rawImpersonateUser = request.cookies.get('impersonate_user')?.value
  let impersonateUserId: string | undefined
  if (rawImpersonateUser && user.role === 'admin') {
    impersonateUserId = await verifySignedCookie(rawImpersonateUser) || undefined
  }

  if (pathname.startsWith('/client') || pathname.startsWith('/api/client')) {
    if (!isImpersonating && user.role !== 'client' && user.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/accountant/dashboard', request.url))
    }
  }

  // Module-based access control for /claims/* and /accountant/claims/*
  if (pathname.startsWith('/accountant/claims') || pathname.startsWith('/claims') || pathname.startsWith('/api/claims')) {
    const userModules = user.modules || ['accounting']
    if (!userModules.includes('claims')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Module not enabled' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/accountant/dashboard', request.url))
    }
    // Claims requires staff role (except /claims/new which is public intake)
    if (!isStaffRole && !pathname.startsWith('/claims/new')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const clientDest = hostname === 'claims.zajcon.cz' ? '/client/claims' : '/client/dashboard'
      return NextResponse.redirect(new URL(clientDest, request.url))
    }
  }

  // Add user info to headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', impersonateUserId || user.id)
  requestHeaders.set('x-user-name', user.name)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-plan', user.plan || 'free')
  requestHeaders.set('x-user-modules', JSON.stringify(user.modules || ['accounting']))
  if (user.firm_id) {
    requestHeaders.set('x-firm-id', user.firm_id)
  }

  // Forward impersonation context if active
  if (isImpersonating) {
    requestHeaders.set('x-impersonate-company', impersonateCompany as string)
  }
  if (impersonateUserId) {
    requestHeaders.set('x-impersonate-user', impersonateUserId)
    requestHeaders.set('x-real-user-id', user.id)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

function handleUnauthenticated(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // claims.zajcon.cz → redirect to /claims landing (not / which would loop)
  const hostname = request.headers.get('host')?.split(':')[0] || ''
  if (hostname === 'claims.zajcon.cz') {
    return NextResponse.redirect(new URL('/claims', request.url))
  }
  // All unauthenticated users → landing page (/ has login CTA)
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
