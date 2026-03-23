import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getStripeCustomerId } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe není nakonfigurovaný.' },
      { status: 503 }
    )
  }

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripeCustomerId = await getStripeCustomerId(userId)
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'Zatím žádné aktivní předplatné.' },
      { status: 400 }
    )
  }

  const origin = request.headers.get('origin') || 'https://app.zajcon.cz'

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/accountant/admin/subscription`,
  })

  return NextResponse.json({ url: session.url })
}
