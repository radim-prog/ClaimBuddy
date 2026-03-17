import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — billing overview for accountant's marketplace provider
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7)
    const view = searchParams.get('view') || 'overview' // overview | configs | cycles

    // Find provider for this user
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, name')
      .eq('user_id', userId)
      .eq('status', 'verified')
      .single()

    if (!provider) {
      return NextResponse.json({ provider: null, configs: [], cycles: [], stats: null })
    }

    if (view === 'configs') {
      const { data } = await supabaseAdmin
        .from('billing_configs')
        .select('*, companies(name)')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })

      return NextResponse.json({
        configs: (data || []).map((d: any) => ({
          ...d,
          company_name: d.companies?.name || null,
        })),
      })
    }

    if (view === 'cycles') {
      const { data } = await supabaseAdmin
        .from('billing_invoices')
        .select('*, companies(name)')
        .eq('provider_id', provider.id)
        .eq('period', period)
        .order('status', { ascending: true })

      return NextResponse.json({
        cycles: (data || []).map((d: any) => ({
          ...d,
          company_name: d.companies?.name || null,
        })),
      })
    }

    // Default overview: stats + current period cycles + overdue
    const [configsRes, cyclesRes, overdueRes] = await Promise.all([
      supabaseAdmin
        .from('billing_configs')
        .select('monthly_fee_czk, status, companies(name)')
        .eq('provider_id', provider.id)
        .eq('status', 'active'),
      supabaseAdmin
        .from('billing_invoices')
        .select('*, companies(name)')
        .eq('provider_id', provider.id)
        .eq('period', period),
      supabaseAdmin
        .from('billing_invoices')
        .select('*, companies(name)')
        .eq('provider_id', provider.id)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true }),
    ])

    const activeConfigs = configsRes.data || []
    const periodCycles = (cyclesRes.data || []).map((d: any) => ({ ...d, company_name: d.companies?.name || null }))
    const overdueCycles = (overdueRes.data || []).map((d: any) => ({ ...d, company_name: d.companies?.name || null }))

    const stats = {
      active_clients: activeConfigs.length,
      total_mrr: activeConfigs.reduce((s: number, c: any) => s + c.monthly_fee_czk, 0),
      pending_amount: periodCycles.filter((c: any) => c.status === 'pending').reduce((s: number, c: any) => s + c.amount_due, 0),
      overdue_amount: overdueCycles.reduce((s: number, c: any) => s + c.amount_due, 0),
      overdue_count: overdueCycles.length,
      paid_this_month: periodCycles.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + c.amount_due, 0),
    }

    return NextResponse.json({ provider, stats, cycles: periodCycles, overdue: overdueCycles })
  } catch (error) {
    console.error('[Billing GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create/update billing config for a client
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, monthly_fee_czk, platform_fee_pct, billing_day, notes } = body

    if (!company_id || !monthly_fee_czk || monthly_fee_czk < 0) {
      return NextResponse.json({ error: 'company_id and monthly_fee_czk required' }, { status: 400 })
    }

    // Find provider for this user
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'verified')
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'No verified provider found' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('billing_configs')
      .upsert({
        provider_id: provider.id,
        company_id,
        monthly_fee_czk,
        platform_fee_pct: platform_fee_pct ?? 5.00,
        billing_day: billing_day ?? 1,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider_id,company_id' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    return NextResponse.json({ success: true, config: data })
  } catch (error) {
    console.error('[Billing POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — mark cycle as paid, pause/cancel config
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { action } = body

    // Find provider for IDOR protection
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'verified')
      .single()

    if (!provider) return NextResponse.json({ error: 'No provider' }, { status: 403 })

    if (action === 'mark_paid') {
      const { cycle_id, payment_method } = body
      if (!cycle_id) return NextResponse.json({ error: 'cycle_id required' }, { status: 400 })

      const { error } = await supabaseAdmin
        .from('billing_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: payment_method || null,
        })
        .eq('id', cycle_id)
        .eq('provider_id', provider.id)
        .in('status', ['pending', 'overdue'])

      if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'update_config') {
      const { config_id, status, monthly_fee_czk, notes } = body
      if (!config_id) return NextResponse.json({ error: 'config_id required' }, { status: 400 })

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (status) updates.status = status
      if (typeof monthly_fee_czk === 'number') updates.monthly_fee_czk = monthly_fee_czk
      if (typeof notes === 'string') updates.notes = notes

      const { error } = await supabaseAdmin
        .from('billing_configs')
        .update(updates)
        .eq('id', config_id)
        .eq('provider_id', provider.id)

      if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'write_off') {
      const { cycle_id } = body
      if (!cycle_id) return NextResponse.json({ error: 'cycle_id required' }, { status: 400 })

      const { error } = await supabaseAdmin
        .from('billing_invoices')
        .update({ status: 'written_off', notes: 'Odpis pohledávky' })
        .eq('id', cycle_id)
        .eq('provider_id', provider.id)
        .eq('status', 'overdue')

      if (error) return NextResponse.json({ error: 'Failed to write off' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[Billing PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
