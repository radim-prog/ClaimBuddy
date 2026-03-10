import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year') || new Date().getFullYear())

    // 1. Get all active companies with billing_settings
    const { data: companies, error: compError } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico, status, billing_settings, created_at')
      .is('deleted_at', null)

    if (compError) throw compError

    // 2. Get revenue goal for the year
    const { data: goal } = await supabaseAdmin
      .from('revenue_goals')
      .select('*')
      .eq('year', year)
      .maybeSingle()

    // 3. Get all events for the year
    const { data: events, error: evError } = await supabaseAdmin
      .from('client_events')
      .select('*, companies(name)')
      .gte('event_date', `${year}-01-01`)
      .lte('event_date', `${year}-12-31`)
      .order('event_date', { ascending: false })

    if (evError) throw evError

    // Calculate current MRR from active companies
    const activeCompanies = (companies || []).filter(c => c.status === 'active')
    const currentMRR = activeCompanies.reduce((sum, c) => {
      const fee = c.billing_settings?.monthly_fee || 0
      return sum + Number(fee)
    }, 0)

    // Calculate total active clients
    const totalActiveClients = activeCompanies.length
    const clientsWithFee = activeCompanies.filter(c => (c.billing_settings?.monthly_fee || 0) > 0)
    const avgFee = clientsWithFee.length > 0
      ? clientsWithFee.reduce((sum, c) => sum + Number(c.billing_settings?.monthly_fee || 0), 0) / clientsWithFee.length
      : 0

    // Events this month
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const monthStr = String(currentMonth).padStart(2, '0')
    const monthEvents = (events || []).filter(e => e.event_date.startsWith(`${year}-${monthStr}`))

    const monthOnboarded = monthEvents.filter(e => e.event_type === 'onboarded')
    const monthChurned = monthEvents.filter(e => e.event_type === 'churned')
    const monthNewMRR = monthOnboarded.reduce((s, e) => s + Number(e.monthly_fee || 0), 0)
    const monthChurnedMRR = monthChurned.reduce((s, e) => s + Number(e.monthly_fee || 0), 0)

    // Year totals
    const yearOnboarded = (events || []).filter(e => e.event_type === 'onboarded')
    const yearChurned = (events || []).filter(e => e.event_type === 'churned')
    const yearNewMRR = yearOnboarded.reduce((s, e) => s + Number(e.monthly_fee || 0), 0)
    const yearChurnedMRR = yearChurned.reduce((s, e) => s + Number(e.monthly_fee || 0), 0)

    // Projection: current MRR * remaining months + past months estimated
    const pastMonths = currentMonth
    const remainingMonths = 12 - currentMonth
    const annualProjection = (currentMRR * pastMonths) + (currentMRR * remainingMonths)

    // Monthly MRR chart data — reconstruct from events
    const monthlyData = []
    // Start with MRR at beginning of year (current MRR minus all net changes this year)
    const netChangeThisYear = yearNewMRR - yearChurnedMRR
    let runningMRR = currentMRR - netChangeThisYear

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, '0')
      const mEvents = (events || []).filter(e => e.event_date.startsWith(`${year}-${mStr}`))
      const mAdded = mEvents.filter(e => e.event_type === 'onboarded').reduce((s, e) => s + Number(e.monthly_fee || 0), 0)
      const mLost = mEvents.filter(e => e.event_type === 'churned').reduce((s, e) => s + Number(e.monthly_fee || 0), 0)
      const mFeeChanges = mEvents.filter(e => e.event_type === 'fee_changed').reduce((s, e) => s + Number(e.monthly_fee || 0) - Number(e.previous_fee || 0), 0)

      runningMRR += mAdded - mLost + mFeeChanges

      // Monthly target from goal
      const monthTarget = goal?.monthly_targets?.[mStr]
        || (goal ? Math.round(Number(goal.annual_revenue_target) / 12) : 0)

      monthlyData.push({
        month: m,
        label: new Date(year, m - 1).toLocaleDateString('cs', { month: 'short' }),
        actual: m <= currentMonth ? runningMRR : null,
        target: monthTarget,
        onboarded: mEvents.filter(e => e.event_type === 'onboarded').length,
        churned: mEvents.filter(e => e.event_type === 'churned').length,
      })
    }

    // Plan fulfillment
    const annualTarget = goal ? Number(goal.annual_revenue_target) : 0
    const fulfillmentPct = annualTarget > 0 ? Math.round((annualProjection / annualTarget) * 100) : 0

    // Churn rate (annual)
    const churnRate = totalActiveClients > 0
      ? Math.round((yearChurned.length / (totalActiveClients + yearChurned.length)) * 100)
      : 0

    return NextResponse.json({
      year,
      currentMRR,
      annualProjection,
      annualTarget,
      fulfillmentPct,
      totalActiveClients,
      avgFee: Math.round(avgFee),
      churnRate,
      thisMonth: {
        onboarded: monthOnboarded.length,
        churned: monthChurned.length,
        newMRR: monthNewMRR,
        churnedMRR: monthChurnedMRR,
        netMRR: monthNewMRR - monthChurnedMRR,
      },
      thisYear: {
        onboarded: yearOnboarded.length,
        churned: yearChurned.length,
        newMRR: yearNewMRR,
        churnedMRR: yearChurnedMRR,
        netMRR: yearNewMRR - yearChurnedMRR,
      },
      monthlyData,
      recentEvents: (events || []).slice(0, 10),
      goal,
    })
  } catch (error) {
    console.error('Revenue fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
