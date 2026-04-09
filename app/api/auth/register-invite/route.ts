import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email-service'
import { startReverseTrial } from '@/lib/subscription-store'
import { IS_CLAIMS_ONLY_PRODUCT } from '@/lib/product-config'

export async function POST(request: NextRequest) {
  const { token, password, name, gdprConsent } = await request.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Chybí povinné údaje' }, { status: 400 })
  }
  if (!gdprConsent) {
    return NextResponse.json({ error: 'Musíte souhlasit se zpracováním osobních údajů' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Heslo musí mít alespoň 8 znaků' }, { status: 400 })
  }

  // Find and validate invite
  const { data: invite } = await supabaseAdmin
    .from('client_invitations')
    .select('id, invited_email, company_id, invited_by, status, expires_at')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Pozvánka nebyla nalezena' }, { status: 404 })
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Pozvánka již byla použita nebo zrušena' }, { status: 410 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    // Mark as expired
    await supabaseAdmin
      .from('client_invitations')
      .update({ status: 'expired' })
      .eq('id', invite.id)
    return NextResponse.json({ error: 'Pozvánka vypršela' }, { status: 410 })
  }

  const email = invite.invited_email

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('email', email)
    .single()

  let newUserId: string

  if (existingUser) {
    // Existing user — must be client role
    if (existingUser.role !== 'client') {
      return NextResponse.json(
        { error: 'Tento email patří existujícímu účtu s jinou rolí.' },
        { status: 409 }
      )
    }
    newUserId = existingUser.id

    // Activate if pending
    if (existingUser.status === 'pending_verification' || IS_CLAIMS_ONLY_PRODUCT) {
      await supabaseAdmin
        .from('users')
        .update({
          status: existingUser.status === 'pending_verification' ? 'active' : existingUser.status,
          ...(IS_CLAIMS_ONLY_PRODUCT ? { modules: ['claims'] } : {}),
        })
        .eq('id', existingUser.id)
    }
  } else {
    // Create new user
    const passwordHash = await hashPassword(password)
    const userName = name?.trim() || email.split('@')[0]

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        name: userName,
        email,
        login_name: email,
        password_hash: passwordHash,
        role: 'client',
        modules: IS_CLAIMS_ONLY_PRODUCT ? ['claims'] : ['accounting'],
        status: 'active', // Skip verification — invite = verified email
        gdpr_consent_at: new Date().toISOString(),
        gdpr_consent_version: '1.0',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Invite register error:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Účet s tímto emailem již existuje' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Nepodařilo se vytvořit účet' }, { status: 500 })
    }

    newUserId = newUser!.id
  }

  // Parallel: update company + membership + mark invite as accepted
  const [companyUpdate, clientMembershipUpsert, invitationUpdate] = await Promise.all([
    supabaseAdmin.from('companies').update({
      owner_id: newUserId,
      assigned_accountant_id: invite.invited_by,
    }).eq('id', invite.company_id),
    supabaseAdmin.from('client_users').upsert({
      user_id: newUserId,
      company_id: invite.company_id,
      role: 'owner',
    }, { onConflict: 'user_id,company_id' }),
    supabaseAdmin.from('client_invitations').update({
      status: 'accepted',
      accepted_by: newUserId,
      accepted_at: new Date().toISOString(),
    }).eq('id', invite.id),
  ])

  if (companyUpdate.error) {
    console.error('Invite register company update error:', companyUpdate.error)
    return NextResponse.json({ error: 'Nepodařilo se propojit klienta s firmou' }, { status: 500 })
  }

  if (invitationUpdate.error) {
    console.error('Invite register invitation update error:', invitationUpdate.error)
    return NextResponse.json({ error: 'Nepodařilo se dokončit přijetí pozvánky' }, { status: 500 })
  }

  if (clientMembershipUpsert.error) {
    console.warn('Invite register client membership upsert warning:', clientMembershipUpsert.error)
  }

  // Start reverse trial (non-blocking) — client portal
  startReverseTrial(newUserId, 'client').catch((err) => {
    console.error('Failed to start trial for invite user:', err)
  })

  // Send welcome email (non-blocking)
  const userName = name?.trim() || email.split('@')[0]
  sendWelcomeEmail(email, existingUser ? 'uživateli' : userName).catch(() => {})

  return NextResponse.json({ success: true })
}
