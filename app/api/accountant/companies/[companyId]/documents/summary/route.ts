import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accountant/companies/[companyId]/documents/summary?year=2026
 *
 * Returns per-month document counts, amounts, and status breakdown
 * for the year-tabs + month-pills navigation in the document register.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  try {
    // 1. Get per-month aggregation for the requested year
    const periodPrefix = `${year}-`
    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('period, status, type, total_with_vat, total_vat')
      .eq('company_id', params.companyId)
      .is('deleted_at', null)
      .like('period', `${periodPrefix}%`)

    if (error) throw error

    // Aggregate in JS (Supabase doesn't support GROUP BY in PostgREST)
    const months: Record<string, {
      count: number
      amount: number
      vat: number
      by_status: Record<string, number>
      by_type: Record<string, number>
    }> = {}

    // Initialize all 12 months
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`
      months[key] = { count: 0, amount: 0, vat: 0, by_status: {}, by_type: {} }
    }

    let yearlyCount = 0
    let yearlyAmount = 0
    let yearlyVat = 0

    for (const doc of docs || []) {
      const period = doc.period
      if (!period || !months[period]) continue

      const m = months[period]
      m.count++
      m.amount += Number(doc.total_with_vat) || 0
      m.vat += Number(doc.total_vat) || 0
      m.by_status[doc.status] = (m.by_status[doc.status] || 0) + 1
      m.by_type[doc.type] = (m.by_type[doc.type] || 0) + 1

      yearlyCount++
      yearlyAmount += Number(doc.total_with_vat) || 0
      yearlyVat += Number(doc.total_vat) || 0
    }

    // 2. Get available years (distinct periods)
    const { data: allPeriods } = await supabaseAdmin
      .from('documents')
      .select('period')
      .eq('company_id', params.companyId)
      .is('deleted_at', null)
      .not('period', 'is', null)

    const yearsSet = new Set<number>()
    yearsSet.add(new Date().getFullYear()) // Always include current year
    for (const row of allPeriods || []) {
      if (row.period && /^\d{4}-\d{2}$/.test(row.period)) {
        yearsSet.add(parseInt(row.period.substring(0, 4)))
      }
    }
    const available_years = Array.from(yearsSet).sort((a, b) => b - a)

    // Format months for response
    const monthsFormatted: Record<string, {
      period: string
      count: number
      amount: number
      vat: number
      by_status: Record<string, number>
      by_type: Record<string, number>
    }> = {}

    for (const [key, val] of Object.entries(months)) {
      monthsFormatted[key] = { period: key, ...val }
    }

    return NextResponse.json({
      year,
      months: monthsFormatted,
      yearly_total: {
        count: yearlyCount,
        amount: Math.round(yearlyAmount * 100) / 100,
        vat: Math.round(yearlyVat * 100) / 100,
      },
      available_years,
    })
  } catch (err) {
    console.error('Document summary error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
