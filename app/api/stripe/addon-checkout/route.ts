import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICES, findOrCreateStripeCustomer } from '@/lib/stripe'
import { getStripeCustomerId, setStripeCustomerId } from '@/lib/subscription-store'
import { getUserById } from '@/lib/user-store'

export const dynamic = 'force-dynamic'

// Addon types that can be purchased via one-time checkout
const ADDON_CONFIG: Record<string, {
  priceKey: keyof typeof STRIPE_PRICES
  mode: 'payment' | 'subscription'
  credits?: number
  creditType?: string
  description: string
}> = {
  extraction_single: {
    priceKey: 'extraction_single',
    mode: 'payment',
    credits: 1,
    creditType: 'extraction',
    description: 'AI vytezeni - 1 doklad',
  },
  extraction_bulk: {
    priceKey: 'extraction_bulk',
    mode: 'payment',
    credits: 50,
    creditType: 'extraction',
    description: 'AI vytezeni - 50 dokladu',
  },
  extraction_opus: {
    priceKey: 'extraction_opus',
    mode: 'payment',
    credits: 10,
    creditType: 'extraction',
    description: 'AI vytezeni Opus - 10 dokladu',
  },
  extra_user: {
    priceKey: 'extra_user',
    mode: 'payment',
    credits: 1,
    creditType: 'extra_user',
    description: 'Extra uzivatelske misto',
  },
  extra_company: {
    priceKey: 'extra_company',
    mode: 'payment',
    credits: 1,
    creditType: 'extra_company',
    description: 'Extra firma',
  },
  randomizer: {
    priceKey: 'randomizer',
    mode: 'payment',
    credits: 1,
    creditType: 'randomizer',
    description: 'AI randomizer knihy jizd',
  },
  travel_yearly_single: {
    priceKey: 'travel_yearly_single',
    mode: 'subscription',
    description: 'Kniha jizd - rocni (1 vozidlo)',
  },
  travel_yearly_fleet: {
    priceKey: 'travel_yearly_fleet',
    mode: 'subscription',
    description: 'Kniha jizd - rocni (flotila)',
  },
  travel_regen: {
    priceKey: 'travel_regen',
    mode: 'payment',
    credits: 5,
    creditType: 'randomizer',
    description: 'Regenerace knihy jizd - 5 kreditu',
  },
}

// MVP 11.5.2026 (Radim/Jarvis): placení vypnuto pro úvodní spuštění.
const STRIPE_DISABLED = process.env.STRIPE_DISABLED === 'true'

export async function POST(request: NextRequest) {
  if (STRIPE_DISABLED) {
    return NextResponse.json(
      { error: 'Placení je v této fázi vypnuto.' },
      { status: 503 }
    )
  }
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe neni nakonfigurovany. Kontaktujte administratora.' },
      { status: 503 }
    )
  }

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { addon_type, quantity } = body as { addon_type: string; quantity?: number }

  if (!addon_type) {
    return NextResponse.json({ error: 'Missing addon_type' }, { status: 400 })
  }

  const config = ADDON_CONFIG[addon_type]
  if (!config) {
    return NextResponse.json(
      { error: `Neplatny typ addonu: ${addon_type}` },
      { status: 400 }
    )
  }

  const priceId = STRIPE_PRICES[config.priceKey]
  if (!priceId) {
    return NextResponse.json(
      { error: 'Cenovy plan neni nakonfigurovany v Stripe.' },
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
  const isClient = userRole === 'client'
  const basePath = isClient ? '/client/subscription' : '/accountant/admin/subscription'

  const qty = Math.max(1, Math.min(quantity || 1, 100))
  const totalCredits = config.credits ? config.credits * qty : undefined

  const session = await stripe.checkout.sessions.create({
    mode: config.mode,
    line_items: [{ price: priceId, quantity: qty }],
    success_url: `${origin}${basePath}?addon_success=${addon_type}`,
    cancel_url: `${origin}${basePath}?addon_cancelled=true`,
    locale: 'cs',
    metadata: {
      user_id: userId,
      type: 'addon_purchase',
      addon_type,
      ...(totalCredits ? { credits: String(totalCredits) } : {}),
      ...(config.creditType ? { credit_type: config.creditType } : {}),
    },
    ...(customerId ? { customer: customerId } : {}),
  })

  return NextResponse.json({ url: session.url })
}
