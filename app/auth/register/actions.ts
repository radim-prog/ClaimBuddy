'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email-service'
import { triggerOnboardingSequence } from '@/lib/marketing-service'

export async function register(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return { error: 'Všechna pole jsou povinná' }
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Neplatný formát emailu' }
  }

  if (password.length < 8) {
    return { error: 'Heslo musí mít alespoň 8 znaků' }
  }

  if (password !== confirmPassword) {
    return { error: 'Hesla se neshodují' }
  }

  try {
    // Check email uniqueness
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: 'Účet s tímto emailem již existuje' }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    ).toISOString()

    // Insert user
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        login_name: email,
        password_hash: passwordHash,
        role: 'client',
        status: 'pending_verification',
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
      })

    if (insertError) {
      console.error('User insert error:', insertError)
      if (insertError.code === '23505') {
        return { error: 'Účet s tímto emailem již existuje' }
      }
      return { error: 'Nepodařilo se vytvořit účet. Zkuste to prosím znovu.' }
    }

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'
    const verifyUrl = `${appUrl}/api/auth/verify?token=${verificationToken}`

    await sendVerificationEmail(email, name, verifyUrl)

    // Trigger onboarding email sequence (non-blocking)
    triggerOnboardingSequence(email).catch(() => {})
  } catch (err) {
    console.error('Registration error:', err)
    return { error: 'Nepodařilo se dokončit registraci. Zkuste to prosím znovu.' }
  }

  redirect('/auth/verify-sent')
}
