import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

const EMPTY_REPORT = {
  income: { total: 0, paid: 0, unpaid: 0 },
  expenses: { total: 0, matched: 0, unmatched: 0, non_deductible: 0, ignored: 0 },
  tax_impact: 0,
  tax_impact_breakdown: { income_tax_loss: 0, vat_deduction_loss: 0 },
  top_missing: [] as any[],
  monthly_chart: [] as any[],
}

async function buildReportFromTransactions(companyId: string, period: string) {
  const { data: allTrans, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', `${period}-01`)
    .lte('date', `${period}-31`)

  if (error || !allTrans || allTrans.length === 0) return null

  const income = allTrans
    .filter((t: any) => t.amount > 0)
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0)

  const expenses = allTrans
    .filter((t: any) => t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

  return {
    income: { total: income, paid: 0, unpaid: income },
    expenses: { total: expenses, matched: 0, unmatched: expenses, non_deductible: 0, ignored: 0 },
    tax_impact: 0,
    tax_impact_breakdown: { income_tax_loss: 0, vat_deduction_loss: 0 },
    top_missing: [],
    monthly_chart: []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = params

    // Verify user can access this company
    const impersonateCompany = request.headers.get('x-impersonate-company')
    const hasAccess = await canAccessCompany(userId, userRole, companyId, impersonateCompany)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7)

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Try financial_reports table first
    try {
      const { data: existing, error } = await supabaseAdmin
        .from('financial_reports')
        .select('*')
        .eq('company_id', companyId)
        .eq('period', period)
        .maybeSingle()

      if (!error && existing?.data) {
        return NextResponse.json(existing.data)
      }
    } catch { /* table may not exist */ }

    // Try building from transactions
    try {
      const report = await buildReportFromTransactions(companyId, period)
      if (report) return NextResponse.json(report)
    } catch { /* table may not exist */ }

    // No data sources returned data — legitimate empty state
    return NextResponse.json({ ...EMPTY_REPORT, _empty: true })
  } catch (error) {
    console.error(`Report generation failed for company ${companyId}:`, error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
