import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email-service'

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
    if (existingUser.status === 'pending_verification') {
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
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

  // Update company: set owner_id and ensure assigned_accountant_id
  await supabaseAdmin
    .from('companies')
    .update({
      owner_id: newUserId,
      assigned_accountant_id: invite.invited_by,
    })
    .eq('id', invite.company_id)

  // Mark invite as accepted
  await supabaseAdmin
    .from('client_invitations')
    .update({
      status: 'accepted',
      accepted_by: newUserId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  // Send welcome email (non-blocking)
  const userName = name?.trim() || email.split('@')[0]
  sendWelcomeEmail(email, existingUser ? 'uživateli' : userName).catch(() => {})

  return NextResponse.json({ success: true })
}
