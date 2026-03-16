'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPasswordResetEmail } from '@/lib/email-service'

export async function forgotPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return { error: 'Email je povinný' }
  }

  try {
    // Find user by email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    // If user exists, generate token and send email
    // ALWAYS redirect with same message regardless of whether user exists (security)
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(
        Date.now() + 60 * 60 * 1000 // 1 hour
      ).toISOString()

      await supabaseAdmin
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpires,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'
      const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`

      await sendPasswordResetEmail(user.email, user.name, resetUrl)
    }
  } catch (err) {
    console.error('Forgot password error:', err)
    // Still redirect — do not reveal whether email exists
  }

  redirect('/auth/forgot-password?sent=true')
}
