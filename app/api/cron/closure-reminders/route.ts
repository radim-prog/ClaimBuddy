import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'

export const dynamic = 'force-dynamic'

// Escalation levels based on days since period end
type EscalationLevel = 'info' | 'warning' | 'critical'

function getEscalationLevel(daysPastDeadline: number): EscalationLevel {
  if (daysPastDeadline >= 20) return 'critical'
  if (daysPastDeadline >= 10) return 'warning'
  return 'info'
}

const levelEmoji: Record<EscalationLevel, string> = {
  info: '',
  warning: '!',
  critical: '!!',
}

const monthNames = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
]

// GET /api/cron/closure-reminders
// Daily cron: send escalating reminders for incomplete closures
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    // Previous month's period (closures are due for last month)
    const targetMonth = now.getMonth() // 0-indexed, so this is previous month in 1-indexed
    const targetYear = targetMonth === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const adjustedMonth = targetMonth === 0 ? 12 : targetMonth
    const period = `${targetYear}-${String(adjustedMonth).padStart(2, '0')}`

    // Days past deadline (1st of current month = day 0)
    const daysPastDeadline = now.getDate()
    const level = getEscalationLevel(daysPastDeadline)

    // Fetch all active companies with their owner emails
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, owner_id, email')
      .eq('active', true)

    if (!companies || companies.length === 0) {
      return NextResponse.json({ period, sent: 0, skipped: 0, message: 'No active companies' })
    }

    // Fetch closures for the period
    const companyIds = companies.map(c => c.id)
    const { data: closures } = await supabaseAdmin
      .from('monthly_closures')
      .select('company_id, status, reminder_count')
      .in('company_id', companyIds)
      .eq('period', period)

    const closureMap = new Map<string, any>()
    for (const c of closures || []) {
      closureMap.set(c.company_id, c)
    }

    // Determine which companies need reminders
    let sent = 0
    let skipped = 0
    const results: { company: string; status: string; level?: string }[] = []

    for (const company of companies) {
      const closure = closureMap.get(company.id)

      // Skip if already approved/closed
      if (closure?.status === 'approved' || closure?.status === 'closed') {
        skipped++
        results.push({ company: company.name, status: 'approved' })
        continue
      }

      // Skip if already reminded at this level or higher
      const reminderCount = closure?.reminder_count || 0
      const levelThreshold = level === 'critical' ? 3 : level === 'warning' ? 2 : 1
      if (reminderCount >= levelThreshold) {
        skipped++
        results.push({ company: company.name, status: 'already_reminded' })
        continue
      }

      // Need email address
      const email = company.email
      if (!email) {
        skipped++
        results.push({ company: company.name, status: 'no_email' })
        continue
      }

      // Send reminder
      const monthName = monthNames[adjustedMonth - 1]
      const levelLabel = level === 'critical' ? 'URGENTNÍ: ' : level === 'warning' ? 'Připomenutí: ' : ''
      const subject = `${levelLabel}Uzávěrka za ${monthName} ${targetYear} čeká na dokončení ${levelEmoji[level]}`

      const bodyParts = [
        `<p>Dobrý den,</p>`,
        level === 'critical'
          ? `<p style="color: #dc2626;"><strong>Uzávěrka za ${monthName} ${targetYear} stále není kompletní.</strong> Prosím doplňte chybějící doklady co nejdříve.</p>`
          : level === 'warning'
          ? `<p><strong>Uzávěrka za ${monthName} ${targetYear} zatím nebyla dokončena.</strong> Prosím zkontrolujte stav a doplňte chybějící doklady.</p>`
          : `<p>Připomínáme, že uzávěrka za <strong>${monthName} ${targetYear}</strong> čeká na dokončení. Zkontrolujte prosím stav v portálu.</p>`,
        `<p>Přihlaste se do klientského portálu a zkontrolujte stav uzávěrky.</p>`,
        `<p>S pozdravem,<br/>Váš účetní tým</p>`,
      ]

      try {
        await sendEmail({
          to: email,
          subject,
          html: bodyParts.join('\n'),
        })

        // Update reminder count
        if (closure) {
          await supabaseAdmin
            .from('monthly_closures')
            .update({
              reminder_count: levelThreshold,
              last_reminder_at: new Date().toISOString(),
            })
            .eq('company_id', company.id)
            .eq('period', period)
        } else {
          await supabaseAdmin
            .from('monthly_closures')
            .insert({
              company_id: company.id,
              period,
              status: 'open',
              reminder_count: levelThreshold,
              last_reminder_at: new Date().toISOString(),
            })
        }

        sent++
        results.push({ company: company.name, status: 'sent', level })
      } catch {
        results.push({ company: company.name, status: 'send_failed' })
      }
    }

    return NextResponse.json({
      period,
      level,
      days_past_deadline: daysPastDeadline,
      sent,
      skipped,
      total_companies: companies.length,
      results,
    })
  } catch (error) {
    console.error('[ClosureReminders Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
