export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token a heslo jsou povinné' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Heslo musí mít alespoň 8 znaků' },
        { status: 400 }
      )
    }

    // Find user with this reset token
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { success: false, error: 'Neplatný nebo expirovaný odkaz pro obnovení hesla' },
        { status: 400 }
      )
    }

    // Check token expiry
    const expiresAt = new Date(user.reset_token_expires)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Odkaz pro obnovení hesla vypršel. Požádejte o nový.' },
        { status: 400 }
      )
    }

    // Hash new password and update
    const passwordHash = await hashPassword(password)

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Password reset update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Nepodařilo se změnit heslo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Password reset error:', err)
    return NextResponse.json(
      { success: false, error: 'Interní chyba serveru' },
      { status: 500 }
    )
  }
}
