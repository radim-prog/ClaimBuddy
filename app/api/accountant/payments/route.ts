import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAllCompanies } from '@/lib/company-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString()

  try {
    const [allCompanies, paymentsResult, groupsResult, timeLogsResult] = await Promise.all([
      getAllCompanies(),
      supabaseAdmin
        .from('monthly_payments')
        .select('company_id, period, paid, paid_at')
        .like('period', `${year}-%`),
      supabaseAdmin
        .from('company_groups')
        .select('group_name, billing_company_id'),
      supabaseAdmin
        .from('time_logs')
        .select('company_id, date, minutes, billable, in_tariff')
        .eq('billable', true)
        .eq('in_tariff', false)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`),
    ])

    if (paymentsResult.error) throw paymentsResult.error
    if (groupsResult.error) throw groupsResult.error

    const companies = allCompanies.map(c => ({
      id: c.id,
      name: c.name,
      group_name: c.group_name || null,
      status: c.status || 'active',
      monthly_reporting: c.monthly_reporting ?? true,
      billing_settings: c.billing_settings || null,
    }))

    // Aggregate extra work by company_id + month
    const extraWork: Array<{ company_id: string; period: string; total_minutes: number }> = []
    if (timeLogsResult.data) {
      const map = new Map<string, number>()
      for (const log of timeLogsResult.data) {
        if (!log.date || !log.company_id) continue
        const period = log.date.substring(0, 7) // YYYY-MM
        const key = `${log.company_id}:${period}`
        map.set(key, (map.get(key) || 0) + (log.minutes || 0))
      }
      for (const [key, total_minutes] of map) {
        const [company_id, period] = key.split(':')
        extraWork.push({ company_id, period, total_minutes })
      }
    }

    return NextResponse.json({
      companies,
      payments: paymentsResult.data || [],
      groups: groupsResult.data || [],
      extraWork,
    })
  } catch (error) {
    console.error('Payments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, period, paid } = body

    if (!company_id || !period || typeof paid !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('monthly_payments')
      .upsert(
        {
          company_id,
          period,
          paid,
          paid_at: paid ? new Date().toISOString() : null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,period' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Payment toggle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
