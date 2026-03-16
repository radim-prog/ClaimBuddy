import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'
import { LEAD_EMAIL_VARIANTS } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

const MAX_EMAILS_PER_MONTH = 2
const VARIANT_COUNT = LEAD_EMAIL_VARIANTS.length

/**
 * Weekly cron: send lead nurturing emails to clients without an accountant.
 * Filters: role=client, no company_id (no accountant), marketing_emails != false, max 2/month.
 * Rotates through 4 email variants.
 * Tracks sends in usage_log.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Find eligible clients: role=client, no company_id, has email, marketing not opted out
    const { data: candidates, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, notification_preferences')
      .eq('role', 'client')
      .is('company_id', null)
      .not('email', 'is', null)

    if (fetchErr) throw fetchErr
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: 'No eligible clients' })
    }

    // 2. Filter out opted-out users
    const eligible = candidates.filter(u => {
      const prefs = u.notification_preferences as Record<string, unknown> | null
      return prefs?.marketing_emails !== false
    })

    if (eligible.length === 0) {
      return NextResponse.json({ sent: 0, skipped: candidates.length, message: 'All opted out' })
    }

    // 3. Check how many lead emails each user received this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const userIds = eligible.map(u => u.id)

    const { data: recentLogs } = await supabaseAdmin
      .from('usage_log')
      .select('user_id, id')
      .eq('action', 'lead_email_sent')
      .in('user_id', userIds)
      .gte('created_at', monthStart)

    const sendCountByUser = new Map<string, number>()
    if (recentLogs) {
      for (const log of recentLogs) {
        sendCountByUser.set(log.user_id, (sendCountByUser.get(log.user_id) || 0) + 1)
      }
    }

    // 4. Determine which variant to send (rotate by week number)
    const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    const variantIndex = weekOfYear % VARIANT_COUNT

    let sent = 0
    let skipped = 0

    for (const user of eligible) {
      const currentCount = sendCountByUser.get(user.id) || 0
      if (currentCount >= MAX_EMAILS_PER_MONTH) {
        skipped++
        continue
      }

      const templateFn = LEAD_EMAIL_VARIANTS[variantIndex]
      const template = templateFn(user.name || 'podnikateli')

      try {
        const result = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })

        if (result.success) {
          // Track in usage_log
          await supabaseAdmin.from('usage_log').insert({
            user_id: user.id,
            action: 'lead_email_sent',
            metadata: {
              variant: variantIndex,
              subject: template.subject,
              provider: result.provider,
            },
          })
          sent++
        } else {
          skipped++
        }
      } catch (err) {
        console.error(`[LeadEmails] Error sending to ${user.id}:`, err)
        skipped++
      }
    }

    return NextResponse.json({
      sent,
      skipped,
      eligible: eligible.length,
      variant: variantIndex,
    })
  } catch (err) {
    console.error('[LeadEmails] Cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
