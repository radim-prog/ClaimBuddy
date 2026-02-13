import { NextRequest, NextResponse } from 'next/server'
import { getCompanyById } from '@/lib/company-store'
import { getClosuresByCompany } from '@/lib/closure-store-db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = params

    const company = await getCompanyById(companyId)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const closures = await getClosuresByCompany(companyId)

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        group_name: company.group_name || null,
        ico: company.ico,
        dic: company.dic,
        vat_payer: company.vat_payer,
        vat_period: company.vat_period || null,
        legal_form: company.legal_form,
        street: company.address?.street || null,
        city: company.address?.city || null,
        zip: company.address?.zip || null,
        bank_account: company.bank_account || null,
        health_insurance_company: null,
        has_employees: company.has_employees || false,
        employee_count: 0,
        data_box: null,
        phone: company.phone || null,
        email: company.email || null,
      },
      closures,
    })
  } catch (error) {
    console.error('Company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
