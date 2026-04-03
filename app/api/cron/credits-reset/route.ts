import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getAllPlanLimits } from '@/lib/subscription-store'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// Monthly cron: reset extraction credits for all users based on their plan
// Should run on the 1st of each month
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const currentPeriod = new Date().toISOString().slice(0, 7)

  // Get all active subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, plan_tier, portal_type')
    .in('status', ['active', 'trialing'])

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, created: 0, period: currentPeriod })
  }

  // Get plan limits for credit allocation (both accountant and client portals)
  const accountantLimits = await getAllPlanLimits('accountant')
  const clientLimits = await getAllPlanLimits('client')
  const limitsByPortalAndTier = new Map<string, typeof accountantLimits[number]>()
  for (const l of accountantLimits) limitsByPortalAndTier.set(`accountant:${l.plan_tier}`, l)
  for (const l of clientLimits) limitsByPortalAndTier.set(`client:${l.plan_tier}`, l)

  let created = 0

  for (const sub of subscriptions) {
    const limits = limitsByPortalAndTier.get(`${sub.portal_type}:${sub.plan_tier}`)
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
