import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import {
  upsertSubscription,
  updateSubscriptionByStripeId,
  setStripeCustomerId,
} from '@/lib/subscription-store'
import type Stripe from 'stripe'

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

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const planTier = session.metadata?.plan_tier

        if (!userId || !planTier) {
          console.error('Checkout session missing metadata:', session.id)
          break
        }

        // Save Stripe customer ID
        const customerId = typeof session.customer === 'string' ? session.customer : (session.customer as { id: string } | null)?.id
        if (customerId) {
          await setStripeCustomerId(userId, customerId)
        }

        // Create/update subscription
        const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as { id: string } | null)?.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stripeSubscription: any = subId ? await stripe.subscriptions.retrieve(subId) : null
        const portalType = (session.metadata?.portal_type === 'client' ? 'client' : 'accountant') as 'accountant' | 'client'

        await upsertSubscription({
          user_id: userId,
          portal_type: portalType,
          plan_tier: planTier,
          status: stripeSubscription?.status === 'trialing' ? 'trialing' : 'active',
          stripe_customer_id: customerId || undefined,
          stripe_subscription_id: subId || undefined,
          billing_cycle: stripeSubscription?.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
          trial_end: stripeSubscription?.trial_end
            ? new Date(stripeSubscription.trial_end * 1000).toISOString().split('T')[0]
            : null,
          current_period_end: stripeSubscription?.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
            : null,
        })

        console.log(`Checkout completed: user=${userId}, plan=${planTier}`)
        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any
        const planTier = subscription.metadata?.plan_tier
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined

        await updateSubscriptionByStripeId(subscription.id, {
          status: mapStripeStatus(subscription.status),
          ...(planTier ? { plan_tier: planTier } : {}),
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        })

        console.log(`Subscription updated: ${subscription.id}, status=${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any

        await updateSubscriptionByStripeId(subscription.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })

        console.log(`Subscription cancelled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          await updateSubscriptionByStripeId(subscriptionId, {
            status: 'past_due',
          })
          console.log(`Payment failed for subscription: ${subscriptionId}`)
        }
        break
      }

      case 'invoice.paid': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          await updateSubscriptionByStripeId(subscriptionId, {
            status: 'active',
          })
          console.log(`Payment confirmed for subscription: ${subscriptionId}`)
        }
        break
      }

      default:
        console.log('Unhandled Stripe event:', event.type)
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err)
    // Return 200 to prevent Stripe from retrying on processing errors
    // The error is logged for manual investigation
  }

  return NextResponse.json({ received: true })
}

function mapStripeStatus(status: string): 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete' {
  switch (status) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'
    case 'incomplete': return 'incomplete'
    case 'incomplete_expired': return 'cancelled'
    default: return 'active'
  }
}
