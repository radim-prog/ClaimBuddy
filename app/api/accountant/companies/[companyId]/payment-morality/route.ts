import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { companyId } = await params

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {

    // Get all payments for this company (all years)
    const { data: payments, error } = await supabaseAdmin
      .from('monthly_payments')
      .select('period, paid, paid_at, updated_at')
      .eq('company_id', companyId)
      .order('period', { ascending: true })

    if (error) throw error

    const records = payments || []
    const totalRecords = records.length
    const paidRecords = records.filter(p => p.paid)
    const unpaidRecords = records.filter(p => !p.paid)
    const latePayments = paidRecords.filter(p => {
      if (!p.paid_at || !p.period) return false
      // Payment is "late" if paid_at is after the 15th of the next month
      const [year, month] = p.period.split('-').map(Number)
      const deadline = new Date(year, month, 15) // 15th of NEXT month (month is 0-indexed, so period month = next month)
      return new Date(p.paid_at) > deadline
    })

    // Average days to pay (from period start to paid_at)
    const paymentDelays: number[] = []
    for (const p of paidRecords) {
      if (!p.paid_at || !p.period) continue
      const [year, month] = p.period.split('-').map(Number)
      const periodStart = new Date(year, month - 1, 1) // 1st of the period month
      const paidDate = new Date(p.paid_at)
      const diffDays = Math.round((paidDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0) paymentDelays.push(diffDays)
    }

    const avgDaysToPayment = paymentDelays.length > 0
      ? Math.round(paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length)
      : null

    // Current year stats
    const currentYear = new Date().getFullYear()
    const currentYearRecords = records.filter(p => p.period?.startsWith(`${currentYear}`))
    const currentYearPaid = currentYearRecords.filter(p => p.paid).length
    const currentYearUnpaid = currentYearRecords.filter(p => !p.paid).length

    // Payment rate (all time)
    const paymentRate = totalRecords > 0
      ? Math.round((paidRecords.length / totalRecords) * 100)
      : null

    // Get health score breakdown for payments dimension
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('health_score, health_score_breakdown')
      .eq('id', companyId)
      .single()

    const healthPaymentScore = companyData?.health_score_breakdown?.payments ?? null
    const healthTotalScore = companyData?.health_score ?? null

    return NextResponse.json({
      total_records: totalRecords,
      total_paid: paidRecords.length,
      total_unpaid: unpaidRecords.length,
      late_payments: latePayments.length,
      avg_days_to_payment: avgDaysToPayment,
      payment_rate: paymentRate,
      current_year: {
        paid: currentYearPaid,
        unpaid: currentYearUnpaid,
      },
      health_payment_score: healthPaymentScore,
      health_total_score: healthTotalScore,
      // Last 12 payment records for mini timeline
      recent: records.slice(-12).map(p => ({
        period: p.period,
        paid: p.paid,
      })),
    })
  } catch (error) {
    console.error('Payment morality API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
