import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAllCompanies } from '@/lib/company-store'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString()

  try {
    const [allCompanies, taxDataResult, groupsResult] = await Promise.all([
      getAllCompanies(),
      supabaseAdmin
        .from('tax_period_data')
        .select('*')
        .like('period', `${year}-%`),
      supabaseAdmin
        .from('company_groups')
        .select('group_name, billing_company_id'),
    ])

    if (taxDataResult.error) throw taxDataResult.error
    if (groupsResult.error) throw groupsResult.error

    const companies = allCompanies
      .filter(c => c.status !== 'inactive' && c.monthly_reporting !== false)
      .map(c => ({
        id: c.id,
        name: c.name,
        group_name: c.group_name || null,
        vat_payer: c.vat_payer,
        vat_period: c.vat_period as 'monthly' | 'quarterly' | null,
        legal_form: c.legal_form,
        status: c.status,
        monthly_reporting: c.monthly_reporting,
        managing_director: c.managing_director || null,
      }))

    return NextResponse.json({
      companies,
      taxData: taxDataResult.data || [],
      groups: groupsResult.data || [],
    })
  } catch (error) {
    console.error('Tax data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, period, revenue, expenses, vat_output, vat_input, vat_result, notes } = body

    if (!company_id || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tax_period_data')
      .upsert(
        {
          company_id,
          period,
          revenue: revenue || 0,
          expenses: expenses || 0,
          vat_output: vat_output || 0,
          vat_input: vat_input || 0,
          vat_result: vat_result ?? null,
          notes: notes || null,
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
    console.error('Tax data upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
