export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticate, getRedirectPath, COOKIE_NAME, TOKEN_MAX_AGE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Jméno a heslo jsou povinné' }, { status: 400 })
    }

    const result = await authenticate(username, password)

    if (!result) {
      return NextResponse.json({ error: 'Neplatné jméno nebo heslo' }, { status: 401 })
    }

    cookies().set(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: result.user.id,
        name: result.user.name,
        role: result.user.role,
      },
      redirect: getRedirectPath(result.user.role),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
