import { NextResponse } from 'next/server'
import { getAllCompanies } from '@/lib/company-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const companies = await getAllCompanies()

    return NextResponse.json({
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        group_name: c.group_name || null,
        ico: c.ico,
        dic: c.dic,
        legal_form: c.legal_form,
        vat_payer: c.vat_payer,
        vat_period: c.vat_period || null,
        owner_id: c.owner_id,
        assigned_accountant_id: c.assigned_accountant_id,
        address: c.address,
        bank_account: c.bank_account || null,
        has_employees: c.has_employees || false,
        phone: c.phone || null,
        email: c.email || null,
        status: c.status || 'active',
        reliability_score: c.reliability_score ?? 5,
      })),
      count: companies.length,
    })
  } catch (error) {
    console.error('Companies list API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
