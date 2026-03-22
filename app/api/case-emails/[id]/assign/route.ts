import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserName } from '@/lib/request-utils'

export const dynamic = 'force-dynamic'

// POST: Assign email to a case (project) and create timeline entry
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userName = getUserName(request, '')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { project_id, company_id } = body

    if (!project_id) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 })
    }

    // Get email details
    const { data: email } = await supabaseAdmin
      .from('case_emails')
      .select('*')
      .eq('id', id)
      .single()

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Update email assignment
    const { error: updateError } = await supabaseAdmin
      .from('case_emails')
      .update({
        project_id,
        company_id: company_id || null,
        assigned_at: new Date().toISOString(),
        assigned_by: userId,
        status: 'assigned',
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to assign email' }, { status: 500 })
    }

    // Create timeline entry on the case
    await supabaseAdmin.from('case_timeline').insert({
      project_id,
      event_type: 'email',
      title: `Email: ${email.subject}`,
      description: `Od: ${email.from_name || email.from_address}\n${email.body_text?.substring(0, 200) || ''}`,
      created_by: userId,
      created_by_name: userName || 'Unknown',
      event_date: email.received_at,
      metadata: {
        email_id: id,
        from: email.from_address,
        has_attachments: email.has_attachments,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
