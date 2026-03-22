import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/user-store'
import { createToken, COOKIE_NAME, TOKEN_MAX_AGE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const impersonateCompany = request.headers.get('x-impersonate-company') || null
    const impersonateUser = request.headers.get('x-impersonate-user') || null

    // Sliding session: refresh token if less than 1 day until expiration
    const tokenExp = request.headers.get('x-token-exp')
    if (tokenExp) {
      const expiresIn = parseInt(tokenExp) - Math.floor(Date.now() / 1000)
      const ONE_DAY = 86400
      if (expiresIn > 0 && expiresIn < ONE_DAY) {
        const newToken = createToken({
          id: user.id,
          name: user.name,
          role: user.role,
          plan: user.plan_tier || 'free',
          modules: user.modules || ['accounting'],
          firm_id: user.firm_id || null,
        })
        cookies().set(COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: TOKEN_MAX_AGE,
          path: '/',
        })
      }
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      login_name: user.login_name,
      permissions: user.permissions,
      modules: user.modules || ['accounting'],
      firm_id: user.firm_id || null,
      impersonate_company: impersonateCompany,
      impersonate_user: impersonateUser,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
