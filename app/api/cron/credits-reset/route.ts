import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getAllPlanLimits } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

// Monthly cron: reset extraction credits for all users based on their plan
// Should run on the 1st of each month
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentPeriod = new Date().toISOString().slice(0, 7)

  // Get all active subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, plan_tier, portal_type')
    .in('status', ['active', 'trialing'])

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, created: 0, period: currentPeriod })
  }

  // Get plan limits for credit allocation
  const accountantLimits = await getAllPlanLimits('accountant')
  const limitsByTier = new Map(accountantLimits.map(l => [l.plan_tier, l]))

  let created = 0

  for (const sub of subscriptions) {
    const limits = limitsByTier.get(sub.plan_tier)
    const monthlyCredits = limits?.max_extractions_month

    if (!monthlyCredits || monthlyCredits <= 0) continue

    // Upsert credits for this period (don't reset if already exists — extra purchased credits should persist)
    const { data: existing } = await supabase
      .from('usage_credits')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('credit_type', 'extraction')
      .eq('period', currentPeriod)
      .single()

    if (!existing) {
      await supabase
        .from('usage_credits')
        .insert({
          user_id: sub.user_id,
          credit_type: 'extraction',
          total_credits: monthlyCredits,
          used_credits: 0,
          period: currentPeriod,
        })
      created++
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    period: currentPeriod,
    timestamp: new Date().toISOString(),
  })
}
