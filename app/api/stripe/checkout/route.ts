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
  const isClient = userRole === 'client' || tier === 'basic' || tier === 'premium'
  const portalType = isClient ? 'client' : 'accountant'
  const successUrl = isClient
    ? `${origin}/client/subscription?success=true`
    : `${origin}/accountant/admin/subscription?success=true`
  const cancelUrl = isClient
    ? `${origin}/client/subscription?cancelled=true`
    : `${origin}/accountant/admin/subscription?cancelled=true`

  const sessionParams: Record<string, unknown> = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'cs',
    metadata: { user_id: userId, plan_tier: tier, portal_type: portalType },
  }

  if (customerId) {
    sessionParams.customer = customerId
  }

  // Add trial for new subscriptions (14 days)
  if (!existingCustomerId) {
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: { user_id: userId, plan_tier: tier },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0])

  return NextResponse.json({ url: session.url })
}
