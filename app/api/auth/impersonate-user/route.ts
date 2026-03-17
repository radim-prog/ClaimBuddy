import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const IMPERSONATE_USER_COOKIE = 'impersonate_user'
const MAX_AGE = 3600 // 1 hour

function signValue(value: string): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required')
  const hmac = crypto.createHmac('sha256', secret).update(value).digest('hex')
  return `${value}.${hmac}`
}

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  // Verify user exists and is staff
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, role')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!['accountant', 'admin', 'assistant', 'junior', 'senior'].includes(user.role)) {
    return NextResponse.json({ error: 'Can only impersonate staff users' }, { status: 400 })
  }

  // Set signed httpOnly cookie
  const signedValue = signValue(userId)
  cookies().set(IMPERSONATE_USER_COOKIE, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  return NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name },
  })
}

export async function DELETE() {
  cookies().delete(IMPERSONATE_USER_COOKIE)
  return NextResponse.json({ success: true })
}
