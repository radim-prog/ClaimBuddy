export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/time-entries/summary - Monthly time summary
 *
 * Query params:
 * - company_id: UUID (optional - if omitted, returns all companies)
 * - period: YYYY-MM (required)
 * - user_id: UUID (optional - filter by user)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period')
  const filterUserId = searchParams.get('user_id')

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period je povinné (formát YYYY-MM)' }, { status: 400 })
  }

  const [year, month] = period.split('-').map(Number)
  const firstDay = `${period}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabaseAdmin
    .from('time_logs')
    .select('*')
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)
  if (filterUserId) query = query.eq('user_id', filterUserId)

  const { data: entries, error } = await query

  if (error) {
    console.error('Time summary error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allEntries = entries || []

  // Calculate totals
  let totalMinutes = 0
  let billableMinutes = 0
  let inTariffMinutes = 0
  let billableAmount = 0

  allEntries.forEach(entry => {
    const mins = entry.minutes || Math.round((entry.hours || 0) * 60)
    totalMinutes += mins

    if (entry.in_tariff) {
      inTariffMinutes += mins
    } else if (entry.billable) {
      billableMinutes += mins
      billableAmount += (mins / 60) * (entry.hourly_rate || 700)
    }
  })

  // Group by company if no company_id filter
  const byCompany: Record<string, {
    company_id: string
    company_name: string
    total_minutes: number
    billable_minutes: number
    in_tariff_minutes: number
    billable_amount: number
    entry_count: number
  }> = {}

  allEntries.forEach(entry => {
    const cid = entry.company_id || 'unknown'
    if (!byCompany[cid]) {
      byCompany[cid] = {
        company_id: cid,
        company_name: entry.company_name || 'Neznámá firma',
        total_minutes: 0,
        billable_minutes: 0,
        in_tariff_minutes: 0,
        billable_amount: 0,
        entry_count: 0,
      }
    }
    const mins = entry.minutes || Math.round((entry.hours || 0) * 60)
    byCompany[cid].total_minutes += mins
    byCompany[cid].entry_count++

    if (entry.in_tariff) {
      byCompany[cid].in_tariff_minutes += mins
    } else if (entry.billable) {
      byCompany[cid].billable_minutes += mins
      byCompany[cid].billable_amount += (mins / 60) * (entry.hourly_rate || 700)
    }
  })

  return NextResponse.json({
    period,
    total_minutes: totalMinutes,
    billable_minutes: billableMinutes,
    in_tariff_minutes: inTariffMinutes,
    billable_amount: Math.round(billableAmount),
    entry_count: allEntries.length,
    entries: allEntries,
    by_company: Object.values(byCompany).sort((a, b) => b.total_minutes - a.total_minutes),
  })
}
