import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { sendEmail } from '@/lib/email-service'

export const dynamic = 'force-dynamic'

// POST /api/accountant/closures/remind-batch
// Body: { period, company_ids?: string[], message? }
// Sends reminder emails to all companies with incomplete closures for the period
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { period, company_ids, message } = body

    if (!period) {
      return NextResponse.json({ error: 'Missing period' }, { status: 400 })
    }

    // Get closures that are NOT approved/closed for the period
    let closureQuery = supabaseAdmin
      .from('monthly_closures')
      .select('company_id, status')
      .eq('period', period)
      .not('status', 'in', '("approved","closed")')

    if (company_ids && company_ids.length > 0) {
      closureQuery = closureQuery.in('company_id', company_ids)
    }

    const { data: incompleteClosures } = await closureQuery

    // Also find companies with transactions but no closure record
    let txQuery = supabaseAdmin
      .from('bank_transactions')
      .select('company_id')
      .eq('period', period)

    if (company_ids && company_ids.length > 0) {
      txQuery = txQuery.in('company_id', company_ids)
    }

    const { data: txCompanies } = await txQuery

    // Merge: companies from incomplete closures + companies with transactions but no closure
    const closureCompanyIds = new Set((incompleteClosures || []).map(c => c.company_id))
    const txCompanyIds = new Set((txCompanies || []).map(t => t.company_id))
    const targetCompanyIds = new Set([...closureCompanyIds, ...txCompanyIds])

    if (targetCompanyIds.size === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No companies need reminders' })
    }

    // Get company info + owner emails
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, owner_user_id')
      .in('id', Array.from(targetCompanyIds))

    if (!companies || companies.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    const ownerIds = [...new Set(companies.map(c => c.owner_user_id).filter(Boolean))]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .in('id', ownerIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const [year, month] = period.split('-')
    const monthNames = ['', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
    const periodLabel = `${monthNames[parseInt(month)]} ${year}`

    const results: Array<{ company_id: string; company_name: string; email: string; status: string }> = []
    const now = new Date().toISOString()

    for (const company of companies) {
      const owner = userMap.get(company.owner_user_id)
      if (!owner?.email) {
        results.push({ company_id: company.id, company_name: company.name, email: '', status: 'no_email' })
        continue
      }

      const defaultMessage = `Dobrý den,\n\nprosíme o doplnění podkladů pro měsíční uzávěrku za ${periodLabel} (${company.name}).\n\nPřihlaste se do aplikace a zkontrolujte chybějící doklady.\n\nDěkujeme,\nVáš účetní tým`

      const emailResult = await sendEmail({
        to: owner.email,
        subject: `Upomínka: uzávěrka ${periodLabel} — ${company.name}`,
        text: message || defaultMessage,
        html: `<p>${(message || defaultMessage).replace(/\n/g, '<br>')}</p>`,
      })

      // Update reminder tracking
      try {
        const { data: closureData } = await supabaseAdmin
          .from('monthly_closures')
          .select('reminder_count')
          .eq('company_id', company.id)
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
            .eq('company_id', company.id)
            .eq('period', period)
        }
      } catch { /* ignore */ }

      results.push({
        company_id: company.id,
        company_name: company.name,
        email: owner.email,
        status: emailResult.success ? 'sent' : 'failed',
      })
    }

    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      period,
      total: results.length,
      sent,
      failed,
      no_email: results.filter(r => r.status === 'no_email').length,
      details: results,
    })
  } catch (error) {
    console.error('[ClosureRemindBatch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
