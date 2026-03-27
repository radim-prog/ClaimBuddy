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
// CLIENT ACCOUNTANT DETECTION (dual pricing)
// ============================================

export async function clientHasAccountant(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .not('assigned_accountant_id', 'is', null)
    .is('deleted_at', null)

  return (count ?? 0) > 0
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
  // Optimistic locking: read current state, then UPDATE only if used_credits
  // hasn't changed (prevents race condition / double-consume)
  const credits = await getUsageCredits(userId, creditType, period)
  if (!credits) return false
  if (credits.used_credits >= credits.total_credits) return false

  const { data: updated, error } = await supabase
    .from('usage_credits')
    .update({ used_credits: credits.used_credits + 1 })
    .eq('id', credits.id)
    .eq('used_credits', credits.used_credits) // optimistic lock
    .select('id')

  if (error) throw new Error(`Failed to consume credit: ${error.message}`)

  // No rows updated = concurrent request already consumed → retry once
  if (!updated || updated.length === 0) {
    const retry = await getUsageCredits(userId, creditType, period)
    if (!retry || retry.used_credits >= retry.total_credits) return false
    const { data: retried, error: retryErr } = await supabase
      .from('usage_credits')
      .update({ used_credits: retry.used_credits + 1 })
      .eq('id', retry.id)
      .eq('used_credits', retry.used_credits)
      .select('id')
    if (retryErr) throw new Error(`Failed to consume credit: ${retryErr.message}`)
    return (retried?.length ?? 0) > 0
  }

  return true
}

// Add extra purchased credits to current period
export async function addExtraCredits(userId: string, creditType: string, amount: number): Promise<void> {
  const currentPeriod = new Date().toISOString().slice(0, 7)

  // Check if credits exist for current period
  const existing = await getUsageCredits(userId, creditType, currentPeriod)

  if (existing) {
    // Add to existing credits
    const { error } = await supabase
      .from('usage_credits')
      .update({ total_credits: existing.total_credits + amount })
      .eq('id', existing.id)
    if (error) throw new Error(`Failed to add credits: ${error.message}`)
  } else {
    // Create new credits entry
    const { error } = await supabase
      .from('usage_credits')
      .insert({
        user_id: userId,
        credit_type: creditType,
        total_credits: amount,
        used_credits: 0,
        period: currentPeriod,
      })
    if (error) throw new Error(`Failed to create credits: ${error.message}`)
  }
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
// REVERSE TRIAL (30 days Profi)
// ============================================

const TRIAL_DURATION_DAYS = 30
const TRIAL_TIER = 'professional'

export async function startReverseTrial(userId: string, portalType: 'accountant' | 'client' = 'accountant'): Promise<Subscription | null> {
  // Prevent trial restart: if user already has any subscription (active, trialing, cancelled, etc.), skip
  const existing = await getSubscription(userId, portalType)
  if (existing) return existing

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS)

  return upsertSubscription({
    user_id: userId,
    portal_type: portalType,
    plan_tier: TRIAL_TIER,
    status: 'trialing',
    trial_end: trialEnd.toISOString().split('T')[0],
  })
}

export async function getTrialStatus(userId: string, portalType: 'accountant' | 'client' = 'accountant'): Promise<{
  isTrialing: boolean
  daysRemaining: number
  trialEnd: string | null
  trialTier: string
} | null> {
  const sub = await getSubscription(userId, portalType)
  if (!sub || sub.status !== 'trialing' || !sub.trial_end) {
    return null
  }

  const now = new Date()
  const end = new Date(sub.trial_end)
  const diffMs = end.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  return {
    isTrialing: true,
    daysRemaining,
    trialEnd: sub.trial_end,
    trialTier: sub.plan_tier,
  }
}

export async function downgradeExpiredTrials(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { data: expired } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'trialing')
    .lt('trial_end', today)

  if (!expired || expired.length === 0) return 0

  let count = 0
  for (const sub of expired) {
    // Only downgrade if no active Stripe subscription
    if (!sub.stripe_subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          plan_tier: 'free',
          status: 'active',
          trial_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

      await supabase
        .from('users')
        .update({ plan_tier: 'free' })
        .eq('id', sub.user_id)

      count++
    }
  }

  return count
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
