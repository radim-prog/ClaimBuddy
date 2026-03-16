import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function getCompanyId(userId: string, userRole: string | null, impersonateCompany: string | null): Promise<string | null> {
  if (impersonateCompany) return impersonateCompany
  const isStaff = userRole === 'admin' || userRole === 'accountant'
  if (isStaff) return null
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .limit(1)
    .single()
  return data?.id || null
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const impersonateCompany = request.headers.get('x-impersonate-company')
  const companyId = request.nextUrl.searchParams.get('company_id')
    || await getCompanyId(userId, userRole, impersonateCompany)

  if (!companyId) return NextResponse.json({ error: 'No company selected' }, { status: 400 })

  try {
    // Check portal_sections access
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('portal_sections, owner_id, vat_payer')
      .eq('id', companyId)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const isStaff = userRole === 'admin' || userRole === 'accountant'
    if (!isStaff && company.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isStaff && !company.portal_sections?.tax_overview) {
      return NextResponse.json({ error: 'Section not enabled' }, { status: 403 })
    }

    const currentYear = new Date().getFullYear()

    const [periodResult, annualResult] = await Promise.all([
      supabaseAdmin
        .from('tax_period_data')
        .select('period, revenue, expenses, vat_output, vat_input, vat_result')
        .eq('company_id', companyId)
        .like('period', `${currentYear}-%`)
        .order('period'),
      supabaseAdmin
        .from('tax_annual_config')
        .select('year, initial_tax_base')
        .eq('company_id', companyId)
        .eq('year', currentYear)
        .maybeSingle(),
    ])

    if (periodResult.error) throw periodResult.error

    const periods = periodResult.data || []
    const totalRevenue = periods.reduce((s, p) => s + (p.revenue || 0), 0)
    const totalExpenses = periods.reduce((s, p) => s + (p.expenses || 0), 0)
    const totalVatOutput = periods.reduce((s, p) => s + (p.vat_output || 0), 0)
    const totalVatInput = periods.reduce((s, p) => s + (p.vat_input || 0), 0)

    return NextResponse.json({
      year: currentYear,
      periods,
      summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        vat_balance: totalVatOutput - totalVatInput,
      },
      vat_payer: company.vat_payer,
    })
  } catch (error) {
    console.error('Client taxes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
