import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendInvitationEmail } from '@/lib/email-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !['admin', 'accountant', 'senior'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await params
  const body = await request.json()
  const email = (body.email as string)?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Neplatný email' }, { status: 400 })
  }

  // Check company exists and has no owner
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name, ico, owner_id')
    .eq('id', companyId)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Firma nenalezena' }, { status: 404 })
  }
  if (company.owner_id) {
    return NextResponse.json(
      { error: 'Firma již má přiřazeného klienta. Nejdřív odeberte stávajícího.' },
      { status: 409 }
    )
  }

  // Check no existing user with this email is an accountant
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', email)
    .single()

  if (existingUser && existingUser.role !== 'client') {
    return NextResponse.json(
      { error: 'Tento email patří existujícímu účtu s jinou rolí.' },
      { status: 409 }
    )
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Insert invite (partial unique index prevents duplicate pending invites)
  const { error: insertError } = await supabaseAdmin
    .from('client_invitations')
    .insert({
      company_id: companyId,
      invited_email: email,
      invited_by: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Pro tento email a firmu již existuje čekající pozvánka.' },
        { status: 409 }
      )
    }
    console.error('Invite insert error:', insertError)
    return NextResponse.json({ error: 'Nepodařilo se vytvořit pozvánku' }, { status: 500 })
  }

  // Get inviter name for email
  const { data: inviter } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', userId)
    .single()

  // Send invitation email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'
  const inviteUrl = `${appUrl}/auth/register/invite?token=${token}`

  await sendInvitationEmail(
    email,
    company.name,
    inviter?.name ?? 'Váš účetní',
    inviteUrl
  )

  return NextResponse.json({
    success: true,
    expiresAt: expiresAt.toISOString(),
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !['admin', 'accountant', 'senior'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await params

  const { data } = await supabaseAdmin
    .from('client_invitations')
    .select('id, invited_email, status, expires_at, created_at, accepted_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !['admin', 'accountant', 'senior'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await params
  const { invitationId } = await request.json()

  if (!invitationId) {
    return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 })
  }

  await supabaseAdmin
    .from('client_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('company_id', companyId)
    .eq('status', 'pending')

  return NextResponse.json({ success: true })
}
