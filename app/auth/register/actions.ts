'use server'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword, createToken, COOKIE_NAME, TOKEN_MAX_AGE, getRedirectPath } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email-service'
import { triggerOnboardingSequence } from '@/lib/marketing-service'
import { registerSchema, formatZodErrors } from '@/lib/validations'

// MVP 11.5.2026 (Radim/Jarvis): registrace bez email verification.
// Účet je rovnou active a uživatel je auto-přihlášen + redirect na dashboard.
// Lze vypnout přes env MVP_AUTO_ACTIVATE=false (pak se vrátí původní flow).
const MVP_AUTO_ACTIVATE = process.env.MVP_AUTO_ACTIVATE !== 'false'

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

    // Insert user — status active přímo pokud MVP_AUTO_ACTIVATE, jinak pending_verification.
    const status = MVP_AUTO_ACTIVATE ? 'active' : 'pending_verification'
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        login_name: email,
        password_hash: passwordHash,
        role: 'client',
        modules: ['claims'],
        status,
        verification_token: MVP_AUTO_ACTIVATE ? null : verificationToken,
        verification_token_expires: MVP_AUTO_ACTIVATE ? null : verificationTokenExpires,
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

    // Načti nově založeného uživatele kvůli ID + redirect.
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .select('id, name, role, plan_tier, modules, firm_id, is_system_admin')
      .eq('email', email)
      .single()

    if (newUser) {
      // Link orphaned insurance cases with matching contact_email
      await supabaseAdmin
        .from('insurance_cases')
        .update({ contact_user_id: newUser.id })
        .eq('contact_email', email)
        .is('contact_user_id', null)

      // MVP 11.5.2026: vytvořit placeholder „firmu" pro nového klienta,
      // aby ho admin Radim viděl v seznamu klientů a mohl mu zakládat spisy.
      // Klient si firmu může později upravit v profilu (jméno/IČ/atd.).
      if (MVP_AUTO_ACTIVATE) {
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('owner_id', newUser.id)
          .maybeSingle()

        if (!existingCompany) {
          const { data: newCompany } = await supabaseAdmin
            .from('companies')
            .insert({
              name: `${name} — klient`,
              owner_id: newUser.id,
              source_system: 'claimbuddy',
              status: 'active',
              email,
            })
            .select('id')
            .single()

          if (newCompany) {
            await supabaseAdmin.from('client_users').insert({
              user_id: newUser.id,
              company_id: newCompany.id,
              role: 'owner',
            })
          }
        }
      }

      if (MVP_AUTO_ACTIVATE) {
        // Auto-login: vystavíme token a nastavíme cookie, aby uživatel
        // šel rovnou na dashboard bez druhého kroku.
        const token = createToken({
          id: newUser.id,
          name: newUser.name,
          role: newUser.role,
          plan: newUser.plan_tier || 'free',
          modules: newUser.modules || ['claims'],
          firm_id: newUser.firm_id || null,
          is_system_admin: newUser.is_system_admin || false,
        })
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: TOKEN_MAX_AGE,
          path: '/',
        })
      }
    }

    if (!MVP_AUTO_ACTIVATE) {
      // Verification flow (vypnuté pro MVP). Pokud někdo flag zapne, posílá se email.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://claims.zajcon.cz'
      const verifyUrl = `${appUrl}/api/auth/verify?token=${verificationToken}`
      await sendVerificationEmail(email, name, verifyUrl)
      triggerOnboardingSequence(email).catch(() => {})
    }
  } catch (err) {
    console.error('Registration error:', err)
    return { error: 'Nepodařilo se dokončit registraci. Zkuste to prosím znovu.' }
  }

  // V MVP rovnou na klientský dashboard, jinak na "ověřte email" stránku.
  redirect(MVP_AUTO_ACTIVATE ? getRedirectPath('client') : '/auth/verify-sent')
}
