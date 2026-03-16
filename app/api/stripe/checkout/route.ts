import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getStripePriceId, findOrCreateStripeCustomer, type PlanTier, type BillingCycle } from '@/lib/stripe'
import { getStripeCustomerId, setStripeCustomerId } from '@/lib/subscription-store'
import { getUserById } from '@/lib/user-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe není nakonfigurovaný. Kontaktujte administrátora.' },
      { status: 503 }
    )
  }

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tier, cycle } = body as { tier: PlanTier; cycle: BillingCycle }

  if (!tier || !cycle) {
    return NextResponse.json({ error: 'Missing tier or cycle' }, { status: 400 })
  }

  const VALID_TIERS = ['starter', 'professional', 'enterprise']
  const VALID_CYCLES = ['monthly', 'annual']
  if (!VALID_TIERS.includes(tier) || !VALID_CYCLES.includes(cycle)) {
    return NextResponse.json({ error: 'Invalid tier or cycle' }, { status: 400 })
  }

  const priceId = getStripePriceId(tier, cycle)
  if (!priceId) {
    return NextResponse.json(
      { error: 'Cenový plán není nakonfigurovaný v Stripe.' },
      { status: 503 }
    )
  }

  // Find or create Stripe customer
  const user = await getUserById(userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const existingCustomerId = await getStripeCustomerId(userId)
  const customerId = await findOrCreateStripeCustomer(userId, user.email, user.name, existingCustomerId)

  if (customerId && customerId !== existingCustomerId) {
    await setStripeCustomerId(userId, customerId)
  }

  const origin = request.headers.get('origin') || 'https://app.zajcon.cz'
  const userRole = request.headers.get('x-user-role')
  const isClient = userRole === 'client' || tier === 'free' || tier === 'plus' || tier === 'premium'
  const portalType = isClient ? 'client' : 'accountant'
  const basePath = isClient ? '/client/subscription' : '/accountant/admin/subscription'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${basePath}?success=true`,
    cancel_url: `${origin}${basePath}?cancelled=true`,
    locale: 'cs',
    metadata: { user_id: userId, plan_tier: tier, portal_type: portalType },
    ...(customerId ? { customer: customerId } : {}),
    // Reverse trial: 30 days Profi for new users
    ...(!existingCustomerId ? {
      subscription_data: {
        trial_period_days: 30,
        metadata: { user_id: userId, plan_tier: tier },
      },
    } : {}),
  })

  return NextResponse.json({ url: session.url })
}
