import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { sendEmail } from '@/lib/email-service'

export const dynamic = 'force-dynamic'

// POST /api/accountant/closures/remind
// Body: { company_id, period, message? }
// Sends a reminder email to the client about incomplete closure
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, period, message } = body

    if (!company_id || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    // Get company + owner email
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, owner_user_id')
      .eq('id', company_id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get owner's email
    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', company.owner_user_id)
      .single()

    if (!owner?.email) {
      return NextResponse.json({ error: 'Company owner has no email' }, { status: 400 })
    }

    const [year, month] = period.split('-')
    const monthNames = ['', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
    const periodLabel = `${monthNames[parseInt(month)]} ${year}`

    const defaultMessage = `Dobrý den,\n\nprosíme o doplnění podkladů pro měsíční uzávěrku za ${periodLabel} (${company.name}).\n\nPřihlaste se do aplikace a zkontrolujte chybějící doklady.\n\nDěkujeme,\nVáš účetní tým`

    const emailResult = await sendEmail({
      to: owner.email,
      subject: `Upomínka: uzávěrka ${periodLabel} — ${company.name}`,
      text: message || defaultMessage,
      html: `<p>${(message || defaultMessage).replace(/\n/g, '<br>')}</p>`,
    })

    // Increment reminder count on closure
    const now = new Date().toISOString()
    const { data: closureData } = await supabaseAdmin
      .from('monthly_closures')
      .select('reminder_count')
      .eq('company_id', company_id)
      .eq('period', period)
      .single()

    if (closureData) {
      await supabaseAdmin
        .from('monthly_closures')
        .update({
          reminder_count: (closureData.reminder_count || 0) + 1,
          last_reminder_sent_at: now,
          updated_at: now,
        })
        .eq('company_id', company_id)
        .eq('period', period)
    }

    return NextResponse.json({
      success: true,
      company_id,
      period,
      email_sent_to: owner.email,
      email_result: emailResult.success ? 'sent' : 'failed',
      provider: emailResult.provider,
    })
  } catch (error) {
    console.error('[ClosureRemind] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
