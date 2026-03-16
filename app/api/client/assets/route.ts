import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function getCompanyId(userId: string, userRole: string | null, impersonateCompany: string | null): Promise<string | null> {
  if (impersonateCompany) return impersonateCompany
  const isStaff = userRole === 'admin' || userRole === 'accountant'
  if (isStaff) return null // Staff without impersonation — no single company
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
      .select('portal_sections, owner_id')
      .eq('id', companyId)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const isStaff = userRole === 'admin' || userRole === 'accountant'
    if (!isStaff && company.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isStaff && !company.portal_sections?.assets) {
      return NextResponse.json({ error: 'Section not enabled' }, { status: 403 })
    }

    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select('id, name, category, acquisition_price, acquisition_date, status, current_value, depreciation_group')
      .eq('company_id', companyId)
      .order('acquisition_date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ assets: assets || [] })
  } catch (error) {
    console.error('Client assets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
