import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// ============================================================================
// TYPES
// ============================================================================

export type PluginType = 'extraction' | 'travel_randomizer' | 'ai_precounting'
export type TransactionStatus = 'pending' | 'settled' | 'paid_out'
export type PayoutStatus = 'pending' | 'approved' | 'paid'

export interface CommissionBreakdown {
  basePrice: number
  markupAmount: number
  totalPrice: number
  commissionAmount: number
  platformFee: number
}

export interface ProviderRevenueSummary {
  providerId: string
  providerName: string
  period: string
  transactionCount: number
  totalRevenue: number
  totalCommission: number
  totalPlatformFee: number
  pendingPayout: number
}

// ============================================================================
// COMMISSION CALCULATION
// ============================================================================

/**
 * Calculate commission breakdown from base price and provider rates.
 * Pure function — no DB calls.
 */
export function calculateCommission(
  basePrice: number,
  markupPct: number,
  revenueSharePct: number
): CommissionBreakdown {
  const markupAmount = Math.round(basePrice * (markupPct / 100))
  const totalPrice = basePrice + markupAmount
  const commissionAmount = Math.round(totalPrice * (revenueSharePct / 100))
  const platformFee = totalPrice - commissionAmount
  return { basePrice, markupAmount, totalPrice, commissionAmount, platformFee }
}

// ============================================================================
// RECORD TRANSACTION
// ============================================================================

/**
 * Record a revenue transaction when a client uses a paid plugin.
 * Called from extraction, randomizer, and AI precounting routes.
 *
 * Flow:
 * 1. Find the client's company → check if company has a marketplace provider
 * 2. Look up plugin base price
 * 3. Calculate markup + commission
 * 4. Insert revenue_transaction
 */
export async function recordRevenueTransaction(params: {
  userId: string
  companyId: string
  pluginType: PluginType
  resourceId?: string
}): Promise<void> {
  const { userId, companyId, pluginType, resourceId } = params

  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id, accountant_id')
      .eq('id', companyId)
      .single()

    if (!company?.accountant_id) return

    const { data: provider } = await supabase
      .from('marketplace_providers')
      .select('id, revenue_share_pct, markup_pct, status')
      .eq('user_id', company.accountant_id)
      .eq('status', 'verified')
      .single()

    if (!provider) return

    const { data: pricing } = await supabase
      .from('plugin_pricing')
      .select('base_price_czk, active')
      .eq('plugin_type', pluginType)
      .single()

    if (!pricing || !pricing.active) return

    const { basePrice, markupAmount, totalPrice, commissionAmount, platformFee } =
      calculateCommission(pricing.base_price_czk, provider.markup_pct, provider.revenue_share_pct)

    const period = new Date().toISOString().slice(0, 7)

    await supabase
      .from('revenue_transactions')
      .insert({
        provider_id: provider.id,
        company_id: companyId,
        user_id: userId,
        plugin_type: pluginType,
        resource_id: resourceId,
        base_price: basePrice,
        markup_amount: markupAmount,
        total_price: totalPrice,
        commission_amount: commissionAmount,
        platform_fee: platformFee,
        period,
        status: 'pending',
      })
  } catch (error) {
    console.error('[Revenue sharing] Failed to record transaction:', error)
  }
}

// ============================================================================
// STATS & QUERIES
// ============================================================================

/**
 * Get revenue stats for a provider (or all providers if admin).
 * Returns per-period aggregates + totals.
 */
export async function getRevenueStats(params: {
  providerId?: string
  period?: string
  limit?: number
}): Promise<{
  transactions: Array<{
    id: string
    plugin_type: PluginType
    total_price: number
    commission_amount: number
    platform_fee: number
    period: string
    status: TransactionStatus
    company_name: string | null
    created_at: string
  }>
  summary: ProviderRevenueSummary[]
  totals: {
    totalRevenue: number
    totalCommission: number
    totalPlatformFee: number
    transactionCount: number
  }
}> {
  const { providerId, period, limit = 200 } = params

  let txQuery = supabase
    .from('revenue_transactions')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (providerId) txQuery = txQuery.eq('provider_id', providerId)
  if (period) txQuery = txQuery.eq('period', period)

  const { data: rawTx, error } = await txQuery
  if (error) throw error

  const transactions = (rawTx || []).map((tx: Record<string, unknown>) => ({
    id: tx.id as string,
    plugin_type: tx.plugin_type as PluginType,
    total_price: tx.total_price as number,
    commission_amount: tx.commission_amount as number,
    platform_fee: tx.platform_fee as number,
    period: tx.period as string,
    status: tx.status as TransactionStatus,
    company_name: (tx.companies as Record<string, unknown>)?.name as string | null,
    created_at: tx.created_at as string,
  }))

  // Aggregate by provider+period
  const summaryMap = new Map<string, ProviderRevenueSummary>()

  for (const tx of transactions) {
    const pid = (rawTx?.find((r: Record<string, unknown>) => r.id === tx.id) as Record<string, unknown>)?.provider_id as string
    const key = `${pid}:${tx.period}`
    const s = summaryMap.get(key) || {
      providerId: pid,
      providerName: '',
      period: tx.period,
      transactionCount: 0,
      totalRevenue: 0,
      totalCommission: 0,
      totalPlatformFee: 0,
      pendingPayout: 0,
    }
    s.transactionCount++
    s.totalRevenue += tx.total_price
    s.totalCommission += tx.commission_amount
    s.totalPlatformFee += tx.platform_fee
    if (tx.status === 'pending') s.pendingPayout += tx.commission_amount
    summaryMap.set(key, s)
  }

  const summary = Array.from(summaryMap.values())
    .sort((a, b) => b.period.localeCompare(a.period))

  const totals = {
    totalRevenue: transactions.reduce((s, t) => s + t.total_price, 0),
    totalCommission: transactions.reduce((s, t) => s + t.commission_amount, 0),
    totalPlatformFee: transactions.reduce((s, t) => s + t.platform_fee, 0),
    transactionCount: transactions.length,
  }

  return { transactions, summary, totals }
}

/**
 * Get pending payout amount for a provider in a given period.
 */
export async function getPendingPayout(providerId: string, period: string): Promise<{
  count: number
  totalCommission: number
  transactionIds: string[]
}> {
  const { data } = await supabase
    .from('revenue_transactions')
    .select('id, commission_amount')
    .eq('provider_id', providerId)
    .eq('period', period)
    .eq('status', 'pending')

  const txs = data || []
  return {
    count: txs.length,
    totalCommission: txs.reduce((s: number, t: Record<string, unknown>) => s + (t.commission_amount as number), 0),
    transactionIds: txs.map((t: Record<string, unknown>) => t.id as string),
  }
}

/**
 * Settle transactions — mark as settled and create/update payout record.
 * Called by admin when generating a payout.
 */
export async function settleTransactions(
  providerId: string,
  period: string,
  transactionIds: string[]
): Promise<{ payoutId: string; totalCommission: number }> {
  // Get totals
  const { data: txs } = await supabase
    .from('revenue_transactions')
    .select('total_price, commission_amount, platform_fee')
    .in('id', transactionIds)

  const items = txs || []
  const totalRevenue = items.reduce((s: number, t: Record<string, unknown>) => s + (t.total_price as number), 0)
  const commissionTotal = items.reduce((s: number, t: Record<string, unknown>) => s + (t.commission_amount as number), 0)
  const platformFeeTotal = items.reduce((s: number, t: Record<string, unknown>) => s + (t.platform_fee as number), 0)

  // Create/update payout
  const { data: payout, error: payError } = await supabase
    .from('revenue_payouts')
    .upsert({
      provider_id: providerId,
      period,
      total_transactions: transactionIds.length,
      total_revenue: totalRevenue,
      commission_total: commissionTotal,
      platform_fee_total: platformFeeTotal,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider_id,period' })
    .select('id')
    .single()

  if (payError) throw payError

  // Mark transactions as settled
  await supabase
    .from('revenue_transactions')
    .update({ status: 'settled' })
    .in('id', transactionIds)

  return { payoutId: payout.id, totalCommission: commissionTotal }
}
