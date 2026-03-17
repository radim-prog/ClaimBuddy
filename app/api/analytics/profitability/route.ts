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
    const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12

    // 1. All active companies with billing info
    const { data: companies, error: compError } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico, status, billing_settings, created_at')
      .is('deleted_at', null)

    if (compError) throw compError

    // 2. billing_configs (preferred source for monthly_fee)
    const { data: billingConfigs } = await supabaseAdmin
      .from('billing_configs')
      .select('company_id, monthly_fee_czk, status')
      .in('status', ['active', 'paused'])

    const billingConfigMap = new Map<string, number>()
    for (const bc of billingConfigs || []) {
      if (bc.status === 'active') {
        billingConfigMap.set(bc.company_id, bc.monthly_fee_czk)
      }
    }

    // 3. All users with compensation
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, name, compensation_type, compensation_amount')

    const userMap = new Map((allUsers || []).map(u => [u.id, u]))

    // 4. Time logs for the year (all companies)
    const { data: timeLogs } = await supabaseAdmin
      .from('time_logs')
      .select('user_id, company_id, hours, minutes, date')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    // 5. Calculate per-company profitability
    const rows = (companies || []).map(company => {
      // Revenue: monthly_fee × months active this year
      const monthlyFee = billingConfigMap.get(company.id) ?? Number(company.billing_settings?.monthly_fee || 0)

      // How many months was this company active in the year?
      const createdDate = new Date(company.created_at)
      const createdYear = createdDate.getFullYear()
      const createdMonth = createdDate.getMonth() + 1

      let activeMonths: number
      if (createdYear < year) {
        activeMonths = currentMonth
      } else if (createdYear === year) {
        activeMonths = Math.max(0, currentMonth - createdMonth + 1)
      } else {
        activeMonths = 0
      }

      const revenueFromFees = monthlyFee * activeMonths

      // Time logs for this company
      const companyLogs = (timeLogs || []).filter(l => l.company_id === company.id)

      // Costs: sum of (hours × user hourly rate) for each time log
      let totalCost = 0
      let totalHours = 0

      for (const log of companyLogs) {
        const mins = ((log.hours || 0) * 60) + (log.minutes || 0)
        const hours = mins / 60
        totalHours += hours

        const user = userMap.get(log.user_id)
        if (!user) continue

        const compType = user.compensation_type || 'hourly'
        const compAmount = Number(user.compensation_amount) || 0

        if (compType === 'hourly') {
          totalCost += hours * compAmount
        } else {
          // Monthly compensation: approximate hourly cost (160h/month standard)
          const hourlyEquivalent = compAmount / 160
          totalCost += hours * hourlyEquivalent
        }
      }

      const revenue = revenueFromFees
      const cost = Math.round(totalCost)
      const profit = revenue - cost
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : (cost > 0 ? -100 : 0)

      return {
        company_id: company.id,
        company_name: company.name,
        ico: company.ico,
        status: company.status,
        monthly_fee: monthlyFee,
        active_months: activeMonths,
        revenue,
        cost,
        profit,
        margin,
        total_hours: Math.round(totalHours * 10) / 10,
      }
    })

    // Sort by profit descending
    rows.sort((a, b) => b.profit - a.profit)

    // Summary
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
    const totalCost = rows.reduce((s, r) => s + r.cost, 0)
    const totalProfit = totalRevenue - totalCost
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
    const profitableCount = rows.filter(r => r.profit > 0).length
    const lossCount = rows.filter(r => r.profit < 0).length

    return NextResponse.json({
      year,
      currentMonth,
      rows,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        avgMargin,
        profitableCount,
        lossCount,
        totalClients: rows.length,
      },
    })
  } catch (error) {
    console.error('Profitability fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
