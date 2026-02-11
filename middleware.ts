import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Inline constants (can't import Node.js crypto modules in Edge Runtime)
const COOKIE_NAME = 'auth_token'
const AUTH_SECRET = process.env.AUTH_SECRET || '5ae35f505756d4e50f6e3e37b14ca985c92acaef936f26b708dc85b9e53d4f29'

const PUBLIC_PATHS = ['/auth/login', '/api/auth/login', '/api/auth/logout', '/api/health', '/api/stripe/webhook']
const STATIC_PREFIXES = ['/_next', '/static', '/favicon.ico']

// Token verification using Web Crypto API (Edge Runtime compatible)
interface TokenPayload {
  id: string
  name: string
  role: string
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

    if (signature !== expectedSig) return null

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

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
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
    if (user.role !== 'client' && user.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/accountant/dashboard', request.url))
    }
  }

  // Root redirect
  if (pathname === '/') {
    const dest = user.role === 'client' ? '/client/dashboard' : '/accountant/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Add user info to headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-name', user.name)
  requestHeaders.set('x-user-role', user.role)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

function handleUnauthenticated(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
