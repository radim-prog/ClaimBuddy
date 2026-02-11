import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getStripePriceId, type PlanTier, type BillingCycle } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe není nakonfigurovaný. Kontaktujte administrátora.' },
      { status: 503 }
    )
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

  const origin = request.headers.get('origin') || 'https://app.zajcon.cz'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/accountant/admin/subscription?success=true`,
    cancel_url: `${origin}/accountant/admin/subscription?cancelled=true`,
    locale: 'cs',
  })

  return NextResponse.json({ url: session.url })
}
