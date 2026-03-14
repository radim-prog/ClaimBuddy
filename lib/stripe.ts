import Stripe from 'stripe'

// Stripe is optional - only initialized when STRIPE_SECRET_KEY is set
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
  }
  return stripeInstance
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

// Price IDs - set in .env.local when Stripe account is ready
export const STRIPE_PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
  professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  // Client portal prices
  client_basic_monthly: process.env.STRIPE_PRICE_CLIENT_BASIC_MONTHLY || '',
  client_basic_yearly: process.env.STRIPE_PRICE_CLIENT_BASIC_YEARLY || '',
  client_premium_monthly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_MONTHLY || '',
  client_premium_yearly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_YEARLY || '',
} as const

export type PlanTier = 'starter' | 'professional' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

export function getStripePriceId(tier: PlanTier, cycle: BillingCycle): string {
  const key = `${tier}_${cycle}` as keyof typeof STRIPE_PRICES
  return STRIPE_PRICES[key]
}

// Find or create a Stripe Customer for a user
export async function findOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null

  // Return existing customer if we have one
  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId)
      return existingCustomerId
    } catch {
      // Customer deleted in Stripe, create new one
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { user_id: userId },
  })

  return customer.id
}
