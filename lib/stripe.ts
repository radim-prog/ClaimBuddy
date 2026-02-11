import Stripe from 'stripe'

// Stripe is optional - only initialized when STRIPE_SECRET_KEY is set
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
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
} as const

export type PlanTier = 'starter' | 'professional' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

export function getStripePriceId(tier: PlanTier, cycle: BillingCycle): string {
  const key = `${tier}_${cycle}` as keyof typeof STRIPE_PRICES
  return STRIPE_PRICES[key]
}
