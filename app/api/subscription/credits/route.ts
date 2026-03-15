import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getStripeCustomerId, setStripeCustomerId, getUsageCredits } from '@/lib/subscription-store'
import { findOrCreateStripeCustomer } from '@/lib/stripe'
import { getUserById } from '@/lib/user-store'

export const dynamic = 'force-dynamic'

const CREDIT_PACKS: Record<string, { credits: number; priceId: string; label: string }> = {
  '50': {
    credits: 50,
    priceId: process.env.STRIPE_PRICE_CREDITS_50 || '',
    label: '50 kreditů za 490 Kč',
  },
  '200': {
    credits: 200,
    priceId: process.env.STRIPE_PRICE_CREDITS_200 || '',
    label: '200 kreditů za 1 490 Kč',
  },
}

// GET: Current credit balance
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const credits = await getUsageCredits(userId, 'extraction', currentPeriod)

  return NextResponse.json({
    credits: credits ? {
      total: credits.total_credits,
      used: credits.used_credits,
      remaining: credits.total_credits - credits.used_credits,
      period: currentPeriod,
    } : null,
    packs: Object.entries(CREDIT_PACKS).map(([key, pack]) => ({
      id: key,
      credits: pack.credits,
      label: pack.label,
    })),
  })
}

// POST: Purchase credit pack
export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe není nakonfigurovaný.' }, { status: 503 })
  }

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { packId } = body as { packId: string }

  const pack = CREDIT_PACKS[packId]
  if (!pack || !pack.priceId) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
  }

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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: pack.priceId, quantity: 1 }],
    success_url: `${origin}/accountant/admin/subscription?credits_success=true`,
    cancel_url: `${origin}/accountant/admin/subscription?credits_cancelled=true`,
    locale: 'cs',
    customer: customerId || undefined,
    metadata: {
      user_id: userId,
      credit_pack: packId,
      credits: String(pack.credits),
      type: 'credit_purchase',
    },
  })

  return NextResponse.json({ url: session.url })
}
