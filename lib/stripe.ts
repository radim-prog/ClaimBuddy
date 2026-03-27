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
// Accountant portal: zaklad (free), profi, business
// Client portal: free, plus, premium
export const STRIPE_PRICES = {
  // Accountant tiers
  profi_monthly: process.env.STRIPE_PRICE_PROFI_MONTHLY || '',
  profi_yearly: process.env.STRIPE_PRICE_PROFI_YEARLY || '',
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
  business_yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || '',
  // Client tiers — standard (without accountant)
  client_plus_monthly: process.env.STRIPE_PRICE_CLIENT_PLUS_MONTHLY || '',
  client_plus_yearly: process.env.STRIPE_PRICE_CLIENT_PLUS_YEARLY || '',
  client_premium_monthly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_MONTHLY || '',
  client_premium_yearly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_YEARLY || '',
  // Client tiers — discounted (with accountant on platform)
  client_plus_discounted_monthly: process.env.STRIPE_PRICE_CLIENT_PLUS_DISC_MONTHLY || '',
  client_plus_discounted_yearly: process.env.STRIPE_PRICE_CLIENT_PLUS_DISC_YEARLY || '',
  client_premium_discounted_monthly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_DISC_MONTHLY || '',
  client_premium_discounted_yearly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_DISC_YEARLY || '',
  // Credit packs
  credit_starter: process.env.STRIPE_PRICE_CREDIT_STARTER || '',
  credit_pro: process.env.STRIPE_PRICE_CREDIT_PRO || '',
  // Per-use addon prices (one-time or metered)
  extraction_single: process.env.STRIPE_PRICE_EXTRACTION_SINGLE || '',
  extraction_bulk: process.env.STRIPE_PRICE_EXTRACTION_BULK || '',
  extraction_opus: process.env.STRIPE_PRICE_EXTRACTION_OPUS || '',
  extra_user: process.env.STRIPE_PRICE_EXTRA_USER || '',
  extra_company: process.env.STRIPE_PRICE_EXTRA_COMPANY || '',
  randomizer: process.env.STRIPE_PRICE_RANDOMIZER || '',
  // Travel generation (kniha jízd)
  travel_yearly_single: process.env.STRIPE_PRICE_TRAVEL_YEARLY_SINGLE || '', // 399 Kč — single vehicle annual
  travel_yearly_fleet: process.env.STRIPE_PRICE_TRAVEL_YEARLY_FLEET || '',   // 599 Kč — fleet (multiple vehicles)
  travel_regen: process.env.STRIPE_PRICE_TRAVEL_REGEN || '',                 // 199 Kč — regeneration credit pack
} as const

// Accountant tiers: free, starter, professional, enterprise (aliases: zaklad, profi, business)
// Client tiers: free, basic, plus, premium
export type AccountantTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'zaklad' | 'profi' | 'business'
export type ClientTier = 'free' | 'basic' | 'plus' | 'premium'
export type PlanTier = AccountantTier | ClientTier
export type BillingCycle = 'monthly' | 'yearly'

export function getStripePriceId(tier: PlanTier, cycle: BillingCycle): string {
  // Free tiers have no Stripe price
  if (tier === 'free' || tier === 'zaklad') return ''

  // Client tiers use client_ prefix
  const isClientTier = tier === 'plus' || tier === 'premium'
  const key = isClientTier
    ? `client_${tier}_${cycle}` as keyof typeof STRIPE_PRICES
    : `${tier}_${cycle}` as keyof typeof STRIPE_PRICES
  return STRIPE_PRICES[key]
}

export function getClientStripePriceId(
  tier: 'plus' | 'premium',
  cycle: BillingCycle,
  hasAccountant: boolean
): string {
  const variant = hasAccountant ? 'discounted_' : ''
  const key = `client_${tier}_${variant}${cycle}` as keyof typeof STRIPE_PRICES
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
