import { NextResponse } from 'next/server'
import { mockCompanies, getClosures } from '@/lib/mock-data'

// DEMO MODE - Using mock data instead of Supabase
export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

    // Get company details from mock data
    const company = mockCompanies.find(c => c.id === companyId)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get monthly closures for this company
    const closures = getClosures()
      .filter(c => c.company_id === companyId)
      .sort((a, b) => b.period.localeCompare(a.period)) // Descending order

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        group_name: (company as any).group_name || null,
        ico: company.ico,
        dic: company.dic,
        vat_payer: company.vat_payer,
        vat_period: company.vat_period || null,
        legal_form: company.legal_form,
        street: company.street,
        city: company.city,
        zip: company.zip,
        bank_account: company.bank_account,
        health_insurance_company: (company as any).health_insurance_company || null,
        has_employees: (company as any).has_employees || false,
        employee_count: (company as any).employee_count || 0,
        data_box: (company as any).data_box ? {
          id: (company as any).data_box.id,
          login: (company as any).data_box.login || null,
          password: (company as any).data_box.password || null,
        } : null,
        phone: (company as any).phone || null,
        email: (company as any).email || null,
      },
      closures,
    })
  } catch (error) {
    console.error('Company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
