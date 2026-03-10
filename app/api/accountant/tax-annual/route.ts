import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  const year = request.nextUrl.searchParams.get('year')

  if (!companyId || !year) {
    return NextResponse.json({ error: 'Missing company_id or year' }, { status: 400 })
  }

  try {
    const [configResult, taxDataResult, ratesResult] = await Promise.all([
      supabaseAdmin
        .from('tax_annual_config')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', parseInt(year))
        .maybeSingle(),
      supabaseAdmin
        .from('tax_period_data')
        .select('revenue, expenses')
        .eq('company_id', companyId)
        .like('period', `${year}-%`),
      supabaseAdmin
        .from('tax_rates')
        .select('rates')
        .eq('year', parseInt(year))
        .maybeSingle(),
    ])

    if (configResult.error) throw configResult.error
    if (taxDataResult.error) throw taxDataResult.error

    // Sum up yearly totals
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
