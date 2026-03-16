import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import {
  upsertSubscription,
  updateSubscriptionByStripeId,
  setStripeCustomerId,
  addExtraCredits,
} from '@/lib/subscription-store'
import type Stripe from 'stripe'
import { logError } from '@/lib/error-logger'

export const dynamic = 'force-dynamic'

// Stripe webhook payloads use raw JSON shapes that differ from SDK types,
// so we use a minimal interface for the fields we actually access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebhookObject = any

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
    logError({ level: 'error', message: 'Stripe webhook verification failed', source: 'stripe-webhook', metadata: { error: String(err) } })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription: WebhookObject = event.data.object
        const planTier = subscription.metadata?.plan_tier
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined

        await updateSubscriptionByStripeId(subscription.id, {
          status: mapStripeStatus(subscription.status),
          ...(planTier ? { plan_tier: planTier } : {}),
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        })

        logError({ level: 'info', message: `Subscription updated: ${subscription.id}, status=${subscription.status}`, source: 'stripe-webhook' })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription: WebhookObject = event.data.object

        await updateSubscriptionByStripeId(subscription.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })

        logError({ level: 'info', message: `Subscription cancelled: ${subscription.id}`, source: 'stripe-webhook' })
        break
      }

      case 'invoice.payment_failed': {
        const subscriptionId = extractSubscriptionId(event.data.object)
        if (subscriptionId) {
          await updateSubscriptionByStripeId(subscriptionId, { status: 'past_due' })
          logError({ level: 'warn', message: `Payment failed for subscription: ${subscriptionId}`, source: 'stripe-webhook' })
        }
        break
      }

      case 'invoice.paid': {
        const paidInvoice: WebhookObject = event.data.object

        // Billing-as-a-service: if the invoice belongs to a billing-service subscription,
        // mark the corresponding billing_invoices record as paid.
        // TODO: Enable when Stripe is fully configured for billing-service subscriptions
        // if (paidInvoice.subscription_details?.metadata?.type === 'billing_service') {
        //   const { markInvoicePaid } = await import('@/lib/billing-service')
        //   // Match by stripe_invoice_id stored in billing_invoices metadata
        // }

        const subscriptionId = extractSubscriptionId(paidInvoice)
        if (subscriptionId) {
          await updateSubscriptionByStripeId(subscriptionId, { status: 'active' })
          logError({ level: 'info', message: `Payment confirmed for subscription: ${subscriptionId}`, source: 'stripe-webhook' })
        }
        break
      }

      default:
        logError({ level: 'info', message: `Unhandled Stripe event: ${event.type}`, source: 'stripe-webhook' })
    }
  } catch (err) {
    logError({ level: 'error', message: `Error processing Stripe event ${event.type}`, source: 'stripe-webhook', stack: err instanceof Error ? err.stack : undefined, metadata: { error: String(err) } })
    // Return 500 so Stripe retries the webhook (up to ~3 days with exponential backoff)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.user_id
  if (!userId) {
    logError({ level: 'error', message: `Checkout session missing user_id: ${session.id}`, source: 'stripe-webhook' })
    return
  }

  // Save Stripe customer ID
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer as { id: string } | null)?.id ?? null
  if (customerId) {
    await setStripeCustomerId(userId, customerId)
  }

  // Handle credit pack purchase (one-time payment)
  if (session.metadata?.type === 'credit_purchase') {
    const credits = parseInt(session.metadata.credits || '0', 10)
    if (credits > 0) {
      await addExtraCredits(userId, 'extraction', credits)
      logError({ level: 'info', message: `Credits purchased: user=${userId}, credits=${credits}`, source: 'stripe-webhook' })
    }
    return
  }

  // Handle subscription checkout
  const planTier = session.metadata?.plan_tier
  if (!planTier) {
    logError({ level: 'error', message: `Checkout session missing plan_tier: ${session.id}`, source: 'stripe-webhook' })
    return
  }

  const subId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as { id: string } | null)?.id ?? null
  const stripeSubscription: WebhookObject = subId ? await stripe.subscriptions.retrieve(subId) : null
  const portalType = session.metadata?.portal_type === 'client' ? 'client' : 'accountant'

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

  logError({ level: 'info', message: `Checkout completed: user=${userId}, plan=${planTier}`, source: 'stripe-webhook' })
}

function extractSubscriptionId(invoice: WebhookObject): string | null {
  if (typeof invoice.subscription === 'string') return invoice.subscription
  return invoice.subscription?.id ?? null
}

function mapStripeStatus(status: string): 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete' {
  switch (status) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'
    case 'incomplete': return 'incomplete'
    case 'incomplete_expired': return 'cancelled'
    default: return 'incomplete'
  }
}
