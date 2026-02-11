import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log('Checkout completed:', session.id, session.customer_email)
      // TODO: Update user subscription in Supabase
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log('Subscription updated:', subscription.id, subscription.status)
      // TODO: Update subscription status in Supabase
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log('Subscription cancelled:', subscription.id)
      // TODO: Downgrade user plan in Supabase
      break
    }
    default:
      console.log('Unhandled Stripe event:', event.type)
  }

  return NextResponse.json({ received: true })
}
