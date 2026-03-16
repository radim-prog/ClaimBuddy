import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

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
  pluginType: 'extraction' | 'travel_randomizer' | 'ai_precounting'
  resourceId?: string
}): Promise<void> {
  const { userId, companyId, pluginType, resourceId } = params

  try {
    // Find if this company's accountant firm is a marketplace provider
    // Companies have an assigned accountant (via company ownership or assignment)
    // Marketplace providers link via company_id
    const { data: company } = await supabase
      .from('companies')
      .select('id, accountant_id')
      .eq('id', companyId)
      .single()

    if (!company?.accountant_id) return // no accountant assigned → no revenue sharing

    // Find the provider linked to the accountant's company or user
    const { data: provider } = await supabase
      .from('marketplace_providers')
      .select('id, revenue_share_pct, markup_pct, status')
      .eq('user_id', company.accountant_id)
      .eq('status', 'verified')
      .single()

    if (!provider) return // accountant is not a marketplace provider

    // Get plugin pricing
    const { data: pricing } = await supabase
      .from('plugin_pricing')
      .select('base_price_czk, active')
      .eq('plugin_type', pluginType)
      .single()

    if (!pricing || !pricing.active) return // plugin not priced or inactive

    const basePrice = pricing.base_price_czk
    const markupAmount = Math.round(basePrice * (provider.markup_pct / 100))
    const totalPrice = basePrice + markupAmount
    const commissionAmount = Math.round(totalPrice * (provider.revenue_share_pct / 100))
    const platformFee = totalPrice - commissionAmount
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM

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
    // Revenue tracking should never break the main flow
    console.error('[Revenue sharing] Failed to record transaction:', error)
  }
}
