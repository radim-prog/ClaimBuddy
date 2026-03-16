import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const currentPeriod = new Date().toISOString().slice(0, 7)
    const today = new Date().toISOString().split('T')[0]

    // 1. Generate cycles for current month
    const { data: configs } = await supabaseAdmin
      .from('client_billing_config')
      .select('*')
      .eq('status', 'active')

    let generated = 0
    for (const config of (configs || [])) {
      const { data: existing } = await supabaseAdmin
        .from('billing_cycles')
        .select('id')
        .eq('config_id', config.id)
        .eq('period', currentPeriod)
        .maybeSingle()

      if (existing) continue

      const platformFee = Math.round(config.monthly_fee_czk * (config.platform_fee_pct / 100))
      const providerPayout = config.monthly_fee_czk - platformFee
      const [year, month] = currentPeriod.split('-').map(Number)
      const dueDate = new Date(year, month - 1, config.billing_day).toISOString().split('T')[0]

      const { error } = await supabaseAdmin
        .from('billing_cycles')
        .insert({
          config_id: config.id,
          provider_id: config.provider_id,
          company_id: config.company_id,
          period: currentPeriod,
          amount_due: config.monthly_fee_czk,
          platform_fee: platformFee,
          provider_payout: providerPayout,
          status: 'pending',
          due_date: dueDate,
        })

      if (!error) generated++
    }

    // 2. Mark pending cycles past due date as overdue
    const { data: newOverdue } = await supabaseAdmin
      .from('billing_cycles')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today)
      .select('id')

    // 3. Escalate overdue cycles based on days past due
    const { data: overdueCycles } = await supabaseAdmin
      .from('billing_cycles')
      .select('id, due_date, escalation_level, reminder_count')
      .eq('status', 'overdue')
      .lt('escalation_level', 3)

    let escalated = 0
    for (const cycle of (overdueCycles || [])) {
      const dueDate = new Date(cycle.due_date)
      const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      let newLevel = cycle.escalation_level
      if (daysPastDue >= 30 && cycle.escalation_level < 3) newLevel = 3
      else if (daysPastDue >= 14 && cycle.escalation_level < 2) newLevel = 2
      else if (daysPastDue >= 7 && cycle.escalation_level < 1) newLevel = 1

      if (newLevel > cycle.escalation_level) {
        await supabaseAdmin
          .from('billing_cycles')
          .update({
            escalation_level: newLevel,
            reminder_count: cycle.reminder_count + 1,
            last_reminder_at: new Date().toISOString(),
          })
          .eq('id', cycle.id)
        escalated++
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      new_overdue: newOverdue?.length || 0,
      escalated,
    })
  } catch (error) {
    console.error('[Billing cron]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
