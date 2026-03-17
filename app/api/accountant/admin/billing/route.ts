import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'admin'
}

// GET — platform-wide billing overview
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7)

    // Platform-wide billing stats
    const [configsRes, cyclesRes, overdueRes] = await Promise.all([
      supabaseAdmin
        .from('billing_configs')
        .select('id, provider_id, monthly_fee_czk, platform_fee_pct, status, marketplace_providers(name)')
        .eq('status', 'active'),
      supabaseAdmin
        .from('billing_invoices')
        .select('*, companies(name), marketplace_providers(name)')
        .eq('period', period)
        .order('status', { ascending: true }),
      supabaseAdmin
        .from('billing_invoices')
        .select('id, amount_due, platform_fee, provider_id, company_id, due_date, escalation_level, companies(name), marketplace_providers(name)')
        .eq('status', 'overdue')
        .order('escalation_level', { ascending: false }),
    ])

    const configs = configsRes.data || []
    const cycles = (cyclesRes.data || []).map((d: any) => ({
      ...d,
      company_name: d.companies?.name || null,
      provider_name: d.marketplace_providers?.name || null,
    }))
    const overdue = (overdueRes.data || []).map((d: any) => ({
      ...d,
      company_name: d.companies?.name || null,
      provider_name: d.marketplace_providers?.name || null,
    }))

    const totalMRR = configs.reduce((s: number, c: any) => s + c.monthly_fee_czk, 0)
    const totalPlatformFee = configs.reduce((s: number, c: any) => s + Math.round(c.monthly_fee_czk * (c.platform_fee_pct / 100)), 0)
    const periodPaid = cycles.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + c.amount_due, 0)
    const periodPending = cycles.filter((c: any) => c.status === 'pending').reduce((s: number, c: any) => s + c.amount_due, 0)
    const overdueTotal = overdue.reduce((s: number, c: any) => s + c.amount_due, 0)

    return NextResponse.json({
      stats: {
        active_configs: configs.length,
        total_mrr: totalMRR,
        platform_fee_mrr: totalPlatformFee,
        period_paid: periodPaid,
        period_pending: periodPending,
        overdue_total: overdueTotal,
        overdue_count: overdue.length,
      },
      cycles,
      overdue,
      period,
    })
  } catch (error) {
    console.error('[Admin billing GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — admin actions (update platform fee, force-generate cycles)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate_cycles') {
      const { period } = body
      if (!period) return NextResponse.json({ error: 'period required' }, { status: 400 })

      // Find all active configs
      const { data: configs } = await supabaseAdmin
        .from('billing_configs')
        .select('*')
        .eq('status', 'active')

      if (!configs || configs.length === 0) {
        return NextResponse.json({ success: true, created: 0 })
      }

      let created = 0
      for (const config of configs) {
        const { data: existing } = await supabaseAdmin
          .from('billing_invoices')
          .select('id')
          .eq('config_id', config.id)
          .eq('period', period)
          .maybeSingle()

        if (existing) continue

        const platformFee = Math.round(config.monthly_fee_czk * (config.platform_fee_pct / 100))
        const providerPayout = config.monthly_fee_czk - platformFee
        const [year, month] = period.split('-').map(Number)
        const dueDate = new Date(year, month - 1, config.billing_day).toISOString().split('T')[0]

        const { error } = await supabaseAdmin
          .from('billing_invoices')
          .insert({
            config_id: config.id,
            provider_id: config.provider_id,
            company_id: config.company_id,
            period,
            amount_due: config.monthly_fee_czk,
            platform_fee: platformFee,
            provider_payout: providerPayout,
            status: 'pending',
            due_date: dueDate,
          })

        if (!error) created++
      }

      return NextResponse.json({ success: true, created })
    }

    if (action === 'update_platform_fee') {
      const { config_id, platform_fee_pct } = body
      if (!config_id || typeof platform_fee_pct !== 'number') {
        return NextResponse.json({ error: 'config_id and platform_fee_pct required' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('billing_configs')
        .update({ platform_fee_pct, updated_at: new Date().toISOString() })
        .eq('id', config_id)

      if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[Admin billing PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
