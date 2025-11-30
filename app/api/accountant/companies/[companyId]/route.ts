import { NextResponse } from 'next/server'
import { mockCompanies, mockMonthlyClosures } from '@/lib/mock-data'

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
    const closures = mockMonthlyClosures
      .filter(c => c.company_id === companyId)
      .sort((a, b) => b.period.localeCompare(a.period)) // Descending order

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        ico: company.ico,
        dic: company.dic,
        vat_payer: company.vat_payer,
        legal_form: company.legal_form,
        street: company.street,
        city: company.city,
        zip: company.zip,
        bank_account: company.bank_account,
      },
      closures,
    })
  } catch (error) {
    console.error('Company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
