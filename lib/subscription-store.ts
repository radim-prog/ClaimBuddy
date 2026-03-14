import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// ============================================
// TYPES
// ============================================

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  portal_type: 'accountant' | 'client'
  plan_tier: string
  billing_cycle: 'monthly' | 'yearly' | null
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete'
  trial_end: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface PlanLimits {
  id: string
  portal_type: string
  plan_tier: string
  max_companies: number | null
  max_users: number | null
  max_extractions_month: number | null
  features: Record<string, boolean>
}

export interface UsageCredit {
  id: string
  user_id: string
  credit_type: string
  total_credits: number
  used_credits: number
  period: string | null
  created_at: string
}

// ============================================
// SUBSCRIPTION CRUD
// ============================================

export async function getSubscription(userId: string, portalType: 'accountant' | 'client'): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('portal_type', portalType)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch subscription: ${error.message}`)
  }
  return data as Subscription
}

export async function upsertSubscription(sub: {
  user_id: string
  portal_type: 'accountant' | 'client'
  plan_tier: string
  status?: Subscription['status']
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_cycle?: 'monthly' | 'yearly' | null
  trial_end?: string | null
  current_period_end?: string | null
  cancelled_at?: string | null
}): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      ...sub,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,portal_type' })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to upsert subscription: ${error.message}`)

  // Sync plan_tier to users table for fast token access
  await supabase
    .from('users')
    .update({ plan_tier: sub.plan_tier })
    .eq('id', sub.user_id)

  return data as Subscription
}

export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  updates: Partial<Pick<Subscription, 'status' | 'plan_tier' | 'current_period_end' | 'cancelled_at'>>
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to update subscription: ${error.message}`)
  }

  // Sync plan_tier to users if changed
  if (updates.plan_tier && data) {
    await supabase
      .from('users')
      .update({ plan_tier: updates.plan_tier })
      .eq('id', (data as Subscription).user_id)
  }

  return data as Subscription
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch subscription: ${error.message}`)
  }
  return data as Subscription
}

// ============================================
// PLAN LIMITS
// ============================================

export async function getPlanLimits(portalType: string, planTier: string): Promise<PlanLimits | null> {
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('portal_type', portalType)
    .eq('plan_tier', planTier)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch plan limits: ${error.message}`)
  }
  return data as PlanLimits
}

export async function getAllPlanLimits(portalType: string): Promise<PlanLimits[]> {
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('portal_type', portalType)

  if (error) throw new Error(`Failed to fetch plan limits: ${error.message}`)
  return (data ?? []) as PlanLimits[]
}

// ============================================
// USAGE CREDITS
// ============================================

export async function getUsageCredits(userId: string, creditType: string, period?: string): Promise<UsageCredit | null> {
  let query = supabase
    .from('usage_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('credit_type', creditType)

  if (period) {
    query = query.eq('period', period)
  } else {
    query = query.is('period', null)
  }

  const { data, error } = await query.single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch usage credits: ${error.message}`)
  }
  return data as UsageCredit
}

export async function consumeCredit(userId: string, creditType: string, period?: string): Promise<boolean> {
  const credits = await getUsageCredits(userId, creditType, period)
  if (!credits) return false
  if (credits.used_credits >= credits.total_credits) return false

  const { error } = await supabase
    .from('usage_credits')
    .update({ used_credits: credits.used_credits + 1 })
    .eq('id', credits.id)

  if (error) throw new Error(`Failed to consume credit: ${error.message}`)
  return true
}

// ============================================
// USAGE LOG
// ============================================

export async function logUsage(userId: string, action: string, resourceId?: string, metadata?: Record<string, unknown>): Promise<void> {
  await supabase
    .from('usage_log')
    .insert({ user_id: userId, action, resource_id: resourceId, metadata })
}

// ============================================
// STRIPE CUSTOMER ID
// ============================================

export async function setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', userId)
}

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  return data?.stripe_customer_id ?? null
}
