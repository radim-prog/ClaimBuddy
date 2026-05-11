import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Logout endpoint: smaže auth_token cookie a přesměruje na home.
// GET i POST funguje (pro pohodlí volání z prohlížeče i z form action).
function clearCookie() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://claims.zajcon.cz'))
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}

export async function GET(_request: NextRequest) {
  return clearCookie()
}

export async function POST(_request: NextRequest) {
  return clearCookie()
}
