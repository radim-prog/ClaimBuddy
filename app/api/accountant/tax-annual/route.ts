import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  const year = request.nextUrl.searchParams.get('year')

  if (!year) {
    return NextResponse.json({ error: 'Missing year' }, { status: 400 })
  }

  const yearNum = parseInt(year)

  // Bulk mode: no company_id → return data for ALL companies
  if (!companyId) {
    try {
      const [companiesResult, configsResult, taxDataResult, ratesResult, groupsResult] = await Promise.all([
        supabaseAdmin
          .from('companies')
          .select('id, name, group_name, vat_payer, vat_period, legal_form, status, monthly_reporting')
          .eq('status', 'active'),
        supabaseAdmin
          .from('tax_annual_config')
          .select('*')
          .eq('year', yearNum),
        supabaseAdmin
          .from('tax_period_data')
          .select('company_id, revenue, expenses')
          .like('period', `${year}-%`),
        supabaseAdmin
          .from('tax_rates')
          .select('rates')
          .eq('year', yearNum)
          .maybeSingle(),
        supabaseAdmin
          .from('company_groups')
          .select('group_name, billing_company_id'),
      ])

      if (companiesResult.error) throw companiesResult.error
      if (configsResult.error) throw configsResult.error
      if (taxDataResult.error) throw taxDataResult.error

      // Build configs dict indexed by company_id
      const configs: Record<string, any> = {}
      for (const cfg of configsResult.data || []) {
        configs[cfg.company_id] = cfg
      }

      // Build monthly totals per company
      const monthlyTotals: Record<string, { revenue: number; expenses: number }> = {}
      for (const d of taxDataResult.data || []) {
        if (!monthlyTotals[d.company_id]) {
          monthlyTotals[d.company_id] = { revenue: 0, expenses: 0 }
        }
        monthlyTotals[d.company_id].revenue += d.revenue || 0
        monthlyTotals[d.company_id].expenses += d.expenses || 0
      }

      return NextResponse.json({
        companies: companiesResult.data || [],
        configs,
        monthlyTotals,
        rates: ratesResult.data?.rates || null,
        groups: groupsResult.data || [],
      })
    } catch (error) {
      console.error('Tax annual bulk API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // Single company mode (existing behavior)
  try {
    const [configResult, taxDataResult, ratesResult] = await Promise.all([
      supabaseAdmin
        .from('tax_annual_config')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', yearNum)
        .maybeSingle(),
      supabaseAdmin
        .from('tax_period_data')
        .select('revenue, expenses')
        .eq('company_id', companyId)
        .like('period', `${year}-%`),
      supabaseAdmin
        .from('tax_rates')
        .select('rates')
        .eq('year', yearNum)
        .maybeSingle(),
    ])

    if (configResult.error) throw configResult.error
    if (taxDataResult.error) throw taxDataResult.error

    const yearTotals = (taxDataResult.data || []).reduce(
      (acc, d) => ({
        revenue: acc.revenue + (d.revenue || 0),
        expenses: acc.expenses + (d.expenses || 0),
      }),
      { revenue: 0, expenses: 0 }
    )

    return NextResponse.json({
      config: configResult.data || null,
      yearTotals,
      rates: ratesResult.data?.rates || null,
    })
  } catch (error) {
    console.error('Tax annual API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, year, ...fields } = body

    if (!company_id || !year) {
      return NextResponse.json({ error: 'Missing company_id or year' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tax_annual_config')
      .upsert(
        {
          company_id,
          year,
          ...fields,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,year' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Tax annual config upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
