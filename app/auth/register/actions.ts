'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email-service'
import { triggerOnboardingSequence } from '@/lib/marketing-service'
import { registerSchema, formatZodErrors } from '@/lib/validations'

export async function register(formData: FormData) {
  const gdprConsent = formData.get('gdprConsent')
  if (gdprConsent !== 'on') {
    return { error: 'Musíte souhlasit se zpracováním osobních údajů' }
  }

  const raw = {
    name: (formData.get('name') as string)?.trim() ?? '',
    email: (formData.get('email') as string)?.trim().toLowerCase() ?? '',
    password: (formData.get('password') as string) ?? '',
    confirmPassword: (formData.get('confirmPassword') as string) ?? '',
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: formatZodErrors(result.error) }
  }

  const { name, email, password } = result.data

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
        gdpr_consent_at: new Date().toISOString(),
        gdpr_consent_version: '1.0',
      })

    if (insertError) {
      console.error('User insert error:', insertError)
      if (insertError.code === '23505') {
        return { error: 'Účet s tímto emailem již existuje' }
      }
      return { error: 'Nepodařilo se vytvořit účet. Zkuste to prosím znovu.' }
    }

    // Link orphaned insurance cases with matching contact_email
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (newUser) {
      await supabaseAdmin
        .from('insurance_cases')
        .update({ contact_user_id: newUser.id })
        .eq('contact_email', email)
        .is('contact_user_id', null)
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
