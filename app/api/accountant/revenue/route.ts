import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — revenue overview for accountant's own marketplace provider
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // YYYY-MM
    const isAdmin = userRole === 'admin'

    // Find provider for this user (or all if admin)
    let providerQuery = supabaseAdmin
      .from('marketplace_providers')
      .select('id, name, revenue_share_pct, markup_pct, payout_method, status')

    if (!isAdmin) {
      providerQuery = providerQuery.eq('user_id', userId)
    }

    const { data: providers, error: provError } = await providerQuery
    if (provError) {
      console.error('[Revenue GET] provider fetch:', provError)
      return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 })
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json({ provider: null, transactions: [], summary: null })
    }

    const providerIds = providers.map(p => p.id)
    const provider = providers[0] // primary provider for non-admin

    // Fetch transactions
    let txQuery = supabaseAdmin
      .from('revenue_transactions')
      .select('*, companies(name)')
      .in('provider_id', providerIds)
      .order('created_at', { ascending: false })
      .limit(200)

    if (period) {
      txQuery = txQuery.eq('period', period)
    }

    const { data: transactions, error: txError } = await txQuery
    if (txError) {
      console.error('[Revenue GET] transactions:', txError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Summary: aggregate by period
    const summaryMap = new Map<string, {
      period: string
      count: number
      total_revenue: number
      commission: number
      platform_fee: number
    }>()

    for (const tx of (transactions || [])) {
      const s = summaryMap.get(tx.period) || {
        period: tx.period,
        count: 0,
        total_revenue: 0,
        commission: 0,
        platform_fee: 0,
      }
      s.count++
      s.total_revenue += tx.total_price
      s.commission += tx.commission_amount
      s.platform_fee += tx.platform_fee
      summaryMap.set(tx.period, s)
    }

    const summary = Array.from(summaryMap.values()).sort((a, b) => b.period.localeCompare(a.period))

    // Fetch payouts
    const { data: payouts } = await supabaseAdmin
      .from('revenue_payouts')
      .select('*')
      .in('provider_id', providerIds)
      .order('period', { ascending: false })
      .limit(24)

    return NextResponse.json({
      provider: isAdmin ? providers : provider,
      transactions: (transactions || []).map((tx: any) => ({
        ...tx,
        company_name: tx.companies?.name || null,
      })),
      summary,
      payouts: payouts || [],
    })
  } catch (error) {
    console.error('[Revenue GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
