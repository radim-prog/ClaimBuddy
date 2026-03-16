import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'admin'
}

// GET — admin: all revenue data, payouts, provider configs
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const providerId = searchParams.get('provider_id')
    const view = searchParams.get('view') || 'summary' // summary | transactions | payouts | pricing

    if (view === 'pricing') {
      const { data } = await supabaseAdmin
        .from('plugin_pricing')
        .select('*')
        .order('plugin_type')
      return NextResponse.json({ pricing: data || [] })
    }

    if (view === 'payouts') {
      let q = supabaseAdmin
        .from('revenue_payouts')
        .select('*, marketplace_providers(name)')
        .order('period', { ascending: false })
        .limit(100)
      if (providerId) q = q.eq('provider_id', providerId)
      if (period) q = q.eq('period', period)
      const { data } = await q
      return NextResponse.json({
        payouts: (data || []).map((p: any) => ({
          ...p,
          provider_name: p.marketplace_providers?.name || null,
        })),
      })
    }

    if (view === 'transactions') {
      let q = supabaseAdmin
        .from('revenue_transactions')
        .select('*, companies(name), marketplace_providers(name)')
        .order('created_at', { ascending: false })
        .limit(500)
      if (providerId) q = q.eq('provider_id', providerId)
      if (period) q = q.eq('period', period)
      const { data } = await q
      return NextResponse.json({
        transactions: (data || []).map((t: any) => ({
          ...t,
          company_name: t.companies?.name || null,
          provider_name: t.marketplace_providers?.name || null,
        })),
      })
    }

    // Default: summary — per-provider per-period aggregates
    const { data: providers } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, name, revenue_share_pct, markup_pct, payout_method, status')
      .eq('status', 'verified')

    // Global stats
    const currentPeriod = period || new Date().toISOString().slice(0, 7)
    const { data: periodTx } = await supabaseAdmin
      .from('revenue_transactions')
      .select('provider_id, total_price, commission_amount, platform_fee')
      .eq('period', currentPeriod)

    // Aggregate per provider
    const providerStats = new Map<string, {
      transactions: number
      total_revenue: number
      commission: number
      platform_fee: number
    }>()

    for (const tx of (periodTx || [])) {
      const s = providerStats.get(tx.provider_id) || {
        transactions: 0, total_revenue: 0, commission: 0, platform_fee: 0,
      }
      s.transactions++
      s.total_revenue += tx.total_price
      s.commission += tx.commission_amount
      s.platform_fee += tx.platform_fee
      providerStats.set(tx.provider_id, s)
    }

    const summary = (providers || []).map(p => ({
      ...p,
      stats: providerStats.get(p.id) || {
        transactions: 0, total_revenue: 0, commission: 0, platform_fee: 0,
      },
    }))

    // Global totals
    const totals = {
      total_revenue: 0,
      total_commission: 0,
      total_platform_fee: 0,
      total_transactions: 0,
    }
    for (const s of providerStats.values()) {
      totals.total_revenue += s.total_revenue
      totals.total_commission += s.commission
      totals.total_platform_fee += s.platform_fee
      totals.total_transactions += s.transactions
    }

    return NextResponse.json({ providers: summary, totals, period: currentPeriod })
  } catch (error) {
    console.error('[Admin revenue GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — admin: update provider revenue config, approve/pay payouts, update pricing
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const body = await request.json()
    const { action } = body

    // Update provider revenue config
    if (action === 'update_provider') {
      const { provider_id, revenue_share_pct, markup_pct, payout_method, bank_account, payout_email } = body
      if (!provider_id) return NextResponse.json({ error: 'provider_id required' }, { status: 400 })

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof revenue_share_pct === 'number') updates.revenue_share_pct = revenue_share_pct
      if (typeof markup_pct === 'number') updates.markup_pct = markup_pct
      if (payout_method) updates.payout_method = payout_method
      if (typeof bank_account === 'string') updates.bank_account = bank_account
      if (typeof payout_email === 'string') updates.payout_email = payout_email

      const { error } = await supabaseAdmin
        .from('marketplace_providers')
        .update(updates)
        .eq('id', provider_id)

      if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Generate payout for a provider + period
    if (action === 'generate_payout') {
      const { provider_id, period } = body
      if (!provider_id || !period) return NextResponse.json({ error: 'provider_id and period required' }, { status: 400 })

      // Aggregate pending transactions
      const { data: txs } = await supabaseAdmin
        .from('revenue_transactions')
        .select('id, total_price, commission_amount, platform_fee')
        .eq('provider_id', provider_id)
        .eq('period', period)
        .eq('status', 'pending')

      if (!txs || txs.length === 0) {
        return NextResponse.json({ error: 'No pending transactions for this period' }, { status: 400 })
      }

      const totalRevenue = txs.reduce((s, t) => s + t.total_price, 0)
      const commissionTotal = txs.reduce((s, t) => s + t.commission_amount, 0)
      const platformFeeTotal = txs.reduce((s, t) => s + t.platform_fee, 0)

      // Create payout record
      const { data: payout, error: payError } = await supabaseAdmin
        .from('revenue_payouts')
        .upsert({
          provider_id,
          period,
          total_transactions: txs.length,
          total_revenue: totalRevenue,
          commission_total: commissionTotal,
          platform_fee_total: platformFeeTotal,
          status: 'pending',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'provider_id,period' })
        .select('*')
        .single()

      if (payError) return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })

      // Mark transactions as settled
      const txIds = txs.map(t => t.id)
      await supabaseAdmin
        .from('revenue_transactions')
        .update({ status: 'settled' })
        .in('id', txIds)

      return NextResponse.json({ success: true, payout })
    }

    // Approve payout
    if (action === 'approve_payout') {
      const { payout_id } = body
      if (!payout_id) return NextResponse.json({ error: 'payout_id required' }, { status: 400 })

      const { error } = await supabaseAdmin
        .from('revenue_payouts')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout_id)
        .eq('status', 'pending')

      if (error) return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Mark payout as paid
    if (action === 'mark_paid') {
      const { payout_id, payout_reference } = body
      if (!payout_id) return NextResponse.json({ error: 'payout_id required' }, { status: 400 })

      const { error } = await supabaseAdmin
        .from('revenue_payouts')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_reference: payout_reference || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout_id)
        .eq('status', 'approved')

      if (error) return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 })

      // Mark all settled transactions as paid_out
      const { data: payout } = await supabaseAdmin
        .from('revenue_payouts')
        .select('provider_id, period')
        .eq('id', payout_id)
        .single()

      if (payout) {
        await supabaseAdmin
          .from('revenue_transactions')
          .update({ status: 'paid_out' })
          .eq('provider_id', payout.provider_id)
          .eq('period', payout.period)
          .eq('status', 'settled')
      }

      return NextResponse.json({ success: true })
    }

    // Update plugin pricing
    if (action === 'update_pricing') {
      const { plugin_type, base_price_czk, active } = body
      if (!plugin_type) return NextResponse.json({ error: 'plugin_type required' }, { status: 400 })

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof base_price_czk === 'number') updates.base_price_czk = base_price_czk
      if (typeof active === 'boolean') updates.active = active

      const { error } = await supabaseAdmin
        .from('plugin_pricing')
        .update(updates)
        .eq('plugin_type', plugin_type)

      if (error) return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[Admin revenue PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
