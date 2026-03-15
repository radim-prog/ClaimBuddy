import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Require SETUP_SECRET (prevents unauthenticated access)
  const setupSecret = process.env.SETUP_SECRET
  if (!setupSecret) {
    return NextResponse.json({ error: 'Setup is disabled' }, { status: 403 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if any admin already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 400 }
      )
    }

    // Require password and credentials in body
    const body = await request.json()
    const { name, email, login_name, password } = body

    if (!name || !email || !login_name || !password) {
      return NextResponse.json(
        { error: 'name, email, login_name, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const userId = crypto.randomUUID()

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        login_name,
        password_hash: passwordHash,
        role: 'admin',
      })

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, name, email },
    })
  } catch (error: unknown) {
    console.error('Setup error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
