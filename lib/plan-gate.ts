import { getPlanLimits, getSubscription, getUsageCredits, logUsage } from '@/lib/subscription-store'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// Master kill switch: when false, all features are allowed
function isMonetizationEnabled(): boolean {
  return process.env.MONETIZATION_ENABLED === 'true'
}

export type PortalType = 'accountant' | 'client'

export interface GateResult {
  allowed: boolean
  reason?: string
  requiredTier?: string
  currentTier?: string
}

// ============================================
// FEATURE ACCESS CHECK
// ============================================

export async function checkFeatureAccess(
  userId: string,
  feature: string,
  portalType: PortalType = 'accountant'
): Promise<GateResult> {
  if (!isMonetizationEnabled()) {
    return { allowed: true }
  }

  const sub = await getSubscription(userId, portalType)
  const tier = resolveTier(sub?.plan_tier ?? 'free')

  // Check subscription status
  if (sub && sub.status === 'cancelled') {
    return {
      allowed: false,
      reason: 'Vaše předplatné bylo zrušeno.',
      currentTier: tier,
    }
  }

  const limits = await getPlanLimits(portalType, tier)
  if (!limits) {
    // No limits defined = deny (fail closed for safety)
    console.warn(`No plan_limits found for ${portalType}/${tier}`)
    return { allowed: false, reason: 'Konfigurace tarifu nenalezena.', currentTier: tier }
  }

  const featureEnabled = limits.features[feature]
  if (featureEnabled === undefined || featureEnabled === true) {
    return { allowed: true }
  }

  // Find the minimum tier that has this feature
  const requiredTier = await findMinimumTier(portalType, feature)

  return {
    allowed: false,
    reason: `Tato funkce vyžaduje tarif ${tierLabel(requiredTier)}.`,
    requiredTier,
    currentTier: tier,
  }
}

// ============================================
// QUANTITY LIMIT CHECK
// ============================================

export async function checkQuantityLimit(
  userId: string,
  resource: 'companies' | 'users',
  portalType: PortalType = 'accountant'
): Promise<GateResult> {
  if (!isMonetizationEnabled()) {
    return { allowed: true }
  }

  const sub = await getSubscription(userId, portalType)
  const tier = resolveTier(sub?.plan_tier ?? 'free')
  const limits = await getPlanLimits(portalType, tier)

  if (!limits) {
    console.warn(`No plan_limits found for ${portalType}/${tier}`)
    return { allowed: false, reason: 'Konfigurace tarifu nenalezena.', currentTier: tier }
  }

  const maxField = resource === 'companies' ? limits.max_companies : limits.max_users
  if (maxField === null) return { allowed: true } // unlimited

  // Count current resources
  let currentCount = 0
  if (resource === 'companies') {
    const { count } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
    currentCount = count ?? 0
  } else {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .in('role', ['accountant', 'assistant', 'admin'])
    currentCount = count ?? 0
  }

  if (currentCount >= maxField) {
    return {
      allowed: false,
      reason: `Dosáhli jste limitu ${maxField} ${resource === 'companies' ? 'firem' : 'uživatelů'} pro tarif ${tierLabel(tier)}.`,
      currentTier: tier,
    }
  }

  return { allowed: true }
}

// ============================================
// EXTRACTION CREDIT CHECK
// ============================================

export async function checkExtractionCredits(
  userId: string,
  portalType: PortalType = 'accountant'
): Promise<GateResult> {
  if (!isMonetizationEnabled()) {
    return { allowed: true }
  }

  const sub = await getSubscription(userId, portalType)
  const tier = resolveTier(sub?.plan_tier ?? 'free')
  const limits = await getPlanLimits(portalType, tier)

  if (!limits) {
    console.warn(`No plan_limits found for ${portalType}/${tier}`)
    return { allowed: false, reason: 'Konfigurace tarifu nenalezena.', currentTier: tier }
  }

  // Check feature access first
  if (limits.features.extraction !== true) {
    return {
      allowed: false,
      reason: `Vytěžování dokumentů vyžaduje tarif ${tierLabel(await findMinimumTier(portalType, 'extraction'))}.`,
      currentTier: tier,
    }
  }

  // Check monthly extraction limit
  if (limits.max_extractions_month !== null && limits.max_extractions_month > 0) {
    const currentPeriod = new Date().toISOString().slice(0, 7) // '2026-03'
    const credits = await getUsageCredits(userId, 'extraction', currentPeriod)

    if (credits && credits.used_credits >= credits.total_credits) {
      return {
        allowed: false,
        reason: `Vyčerpali jste měsíční limit ${limits.max_extractions_month} vytěžení.`,
        currentTier: tier,
      }
    }
  }

  return { allowed: true }
}

// ============================================
// TRAVEL GENERATION CREDIT CHECK
// ============================================

// Credit costs
export const TRAVEL_CREDIT_COSTS = {
  yearly_single: 3,  // single vehicle annual generation
  yearly_fleet: 5,   // fleet (multiple vehicles)
  regen: 2,          // re-generation
} as const

export type TravelCreditType = keyof typeof TRAVEL_CREDIT_COSTS

export async function checkTravelCredits(
  userId: string,
  creditType: TravelCreditType,
  portalType: PortalType = 'accountant'
): Promise<GateResult & { available?: number; required?: number }> {
  if (!isMonetizationEnabled()) {
    return { allowed: true }
  }

  // Feature gate first
  const featureCheck = await checkFeatureAccess(userId, 'travel_generation', portalType)
  if (!featureCheck.allowed) return featureCheck

  const required = TRAVEL_CREDIT_COSTS[creditType]
  const credits = await getUsageCredits(userId, 'travel', undefined)
  const available = credits ? (credits.total_credits - credits.used_credits) : 0

  if (available < required) {
    return {
      allowed: false,
      reason: `Nedostatek kreditů pro generování knihy jízd. Potřeba: ${required}, dostupné: ${available}.`,
      currentTier: (await getSubscription(userId, portalType))?.plan_tier ?? 'free',
      available,
      required,
    }
  }

  return { allowed: true, available, required }
}

export async function consumeTravelCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  // Consume multiple credits at once using optimistic locking
  const credits = await getUsageCredits(userId, 'travel', undefined)
  if (!credits) return false
  if (credits.used_credits + amount > credits.total_credits) return false

  const { data: updated, error } = await (await import('@/lib/supabase-admin')).supabaseAdmin
    .from('usage_credits')
    .update({ used_credits: credits.used_credits + amount })
    .eq('id', credits.id)
    .eq('used_credits', credits.used_credits) // optimistic lock
    .select('id')
    .single()

  if (error || !updated) return false

  await logUsage(userId, 'travel_generation', undefined)
  return true
}

// ============================================
// MESSAGE LIMIT CHECK (Free tier: 5/month)
// ============================================

const FREE_MESSAGE_LIMIT = 5

export async function checkMessageLimit(
  userId: string,
  portalType: PortalType = 'accountant'
): Promise<GateResult & { used?: number; limit?: number }> {
  if (!isMonetizationEnabled()) {
    return { allowed: true }
  }

  const sub = await getSubscription(userId, portalType)
  const tier = resolveTier(sub?.plan_tier ?? 'free')

  // Only free tier has message limits
  if (tier !== 'free') {
    return { allowed: true }
  }

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const { count } = await supabase
    .from('usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', 'message_sent')
    .gte('created_at', `${currentPeriod}-01`)

  const used = count ?? 0

  if (used >= FREE_MESSAGE_LIMIT) {
    return {
      allowed: false,
      reason: `Vyčerpali jste limit ${FREE_MESSAGE_LIMIT} zpráv/měsíc na tarifu Free.`,
      requiredTier: 'starter',
      currentTier: tier,
      used,
      limit: FREE_MESSAGE_LIMIT,
    }
  }

  return { allowed: true, used, limit: FREE_MESSAGE_LIMIT }
}

// ============================================
// LOG GATED ACTION
// ============================================

export async function logGatedAction(userId: string, action: string, resourceId?: string): Promise<void> {
  if (!isMonetizationEnabled()) return
  await logUsage(userId, action, resourceId)
}

// ============================================
// HELPERS
// ============================================

// Tier aliases: plan-gate accepts both CZ names (zaklad/profi/business)
// and DB names (free/starter/professional/enterprise)
const TIER_ALIASES: Record<string, string> = {
  zaklad: 'free',
  profi: 'professional',
  business: 'business',
  // DB names map to themselves
  free: 'free',
  starter: 'starter',
  professional: 'professional',
  enterprise: 'business',
  zaklad: 'zaklad',
  profi: 'profi',
  // Client tiers
  basic: 'basic',
  plus: 'plus',
  premium: 'premium',
}

/** Resolve tier alias to canonical DB name */
export function resolveTier(tier: string): string {
  return TIER_ALIASES[tier] || tier
}

async function findMinimumTier(portalType: string, feature: string): Promise<string> {
  const tierOrder = portalType === 'accountant'
    ? ['free', 'starter', 'professional', 'enterprise']
    : ['free', 'basic', 'plus', 'premium']

  for (const tier of tierOrder) {
    const limits = await getPlanLimits(portalType, tier)
    if (limits?.features[feature] === true) return tier
  }
  return tierOrder[tierOrder.length - 1]
}

function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Profi',
    enterprise: 'Business',
    zaklad: 'Základ',
    profi: 'Profi',
    business: 'Business',
    basic: 'Basic',
    plus: 'Plus',
    premium: 'Premium',
  }
  return labels[tier] || tier
}

// Get user's current plan tier from header (set by middleware) or DB fallback
export async function getUserPlanTier(userId: string, planFromHeader?: string | null): Promise<string> {
  if (planFromHeader) return planFromHeader

  const { data } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', userId)
    .single()

  return data?.plan_tier ?? 'free'
}
