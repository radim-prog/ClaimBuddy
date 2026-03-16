import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWelcomeEmail } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'

  if (!token) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_token`)
  }

  try {
    // Find user with this verification token
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, verification_token_expires')
      .eq('verification_token', token)
      .single()

    if (findError || !user) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_token`)
    }

    // Check token expiry
    const expiresAt = new Date(user.verification_token_expires)
    if (expiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_token`)
    }

    // Activate user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        status: 'active',
        verification_token: null,
        verification_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Verification update error:', updateError)
      return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_token`)
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('Failed to send welcome email:', err)
    })

    return NextResponse.redirect(`${appUrl}/auth/login?verified=true`)
  } catch (err) {
    console.error('Verification error:', err)
    return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_token`)
  }
}
