import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Chybí token' }, { status: 400 })
  }

  const { data: invite } = await supabaseAdmin
    .from('client_invitations')
    .select('id, invited_email, status, expires_at, company_id, invited_by')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.json({ valid: false, error: 'Pozvánka nebyla nalezena' })
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ valid: false, error: 'Pozvánka již byla použita nebo zrušena' })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Pozvánka vypršela' })
  }

  // Get company name (no internal IDs exposed)
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name, ico')
    .eq('id', invite.company_id)
    .single()

  // Get inviter name
  const { data: inviter } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', invite.invited_by)
    .single()

  return NextResponse.json({
    valid: true,
    email: invite.invited_email,
    companyName: company?.name ?? 'Neznámá firma',
    companyIco: company?.ico ?? '',
    inviterName: inviter?.name ?? 'Účetní',
  })
}
