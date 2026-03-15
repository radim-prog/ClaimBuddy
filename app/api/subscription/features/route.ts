import { NextRequest, NextResponse } from 'next/server'
import { getSubscription, getPlanLimits, getTrialStatus } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  const userPlan = request.headers.get('x-user-plan')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const portalType: 'accountant' | 'client' = userRole === 'client' ? 'client' : 'accountant'
  const monetizationEnabled = process.env.MONETIZATION_ENABLED === 'true'

  // If monetization disabled, return enterprise-level access
  if (!monetizationEnabled) {
    const topTier = portalType === 'client' ? 'premium' : 'enterprise'
    const limits = await getPlanLimits(portalType, topTier)

    return NextResponse.json({
      plan_tier: topTier,
      portal_type: portalType,
      features: limits?.features ?? {},
      limits: {
        max_companies: null,
        max_users: null,
        max_extractions_month: null,
      },
      subscription: null,
      monetization_enabled: false,
    })
  }

  const tier = userPlan || 'free'

  const [subscription, limits, trial] = await Promise.all([
    getSubscription(userId, portalType),
    getPlanLimits(portalType, tier),
    getTrialStatus(userId, portalType),
  ])

  return NextResponse.json({
    plan_tier: subscription?.plan_tier ?? tier,
    portal_type: portalType,
    features: limits?.features ?? {},
    limits: {
      max_companies: limits?.max_companies ?? null,
      max_users: limits?.max_users ?? null,
      max_extractions_month: limits?.max_extractions_month ?? null,
    },
    subscription: subscription ? {
      status: subscription.status,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
    } : null,
    trial: trial ?? null,
    monetization_enabled: true,
  })
}
