import { NextResponse } from 'next/server'
import { mockCompanies, mockMonthlyClosures } from '@/lib/mock-data'

// DEMO MODE - Using mock data instead of Supabase
export async function GET(request: Request) {
  try {
    // Use mock data (first company for demo)
    const companies = mockCompanies.slice(0, 3) // Show first 3 companies

    // Get monthly closures for current month
    const currentPeriod = '2025-11' // November 2025 (mock current month)

    const closures = mockMonthlyClosures.filter(c =>
      companies.some(comp => comp.id === c.company_id) &&
      c.period === currentPeriod
    )

    // Enrich companies with closure status
    const enrichedCompanies = companies.map(company => {
      const closure = closures.find(c => c.company_id === company.id)

      const missingDocs = closure ? [
        closure.bank_statement_status === 'missing' ? 'Výpis z účtu' : null,
        closure.expense_invoices_status === 'missing' ? 'Výdajové faktury' : null,
        closure.receipts_status === 'missing' ? 'Účtenky' : null,
        closure.income_invoices_status === 'missing' ? 'Příjmové faktury' : null,
      ].filter(Boolean) : []

      return {
        id: company.id,
        name: company.name,
        ico: company.ico,
        dic: company.dic,
        legal_form: company.legal_form,
        vat_payer: company.vat_payer,
        created_at: company.created_at,
        currentMonthStatus: {
          period: currentPeriod,
          missing_count: missingDocs.length,
          missing_types: missingDocs,
          all_uploaded: missingDocs.length === 0,
          bank_statement_status: closure?.bank_statement_status || 'missing',
          expense_invoices_status: closure?.expense_invoices_status || 'missing',
          receipts_status: closure?.receipts_status || 'missing',
          income_invoices_status: closure?.income_invoices_status || 'missing',
          vat_payable: closure?.vat_payable || null,
          income_tax_accrued: closure?.income_tax_accrued || null,
        }
      }
    })

    // Calculate overall stats
    const stats = {
      total_companies: companies.length,
      companies_with_missing_docs: enrichedCompanies.filter(c => c.currentMonthStatus.missing_count > 0).length,
      total_missing_docs: enrichedCompanies.reduce((sum, c) => sum + c.currentMonthStatus.missing_count, 0),
    }

    return NextResponse.json({
      companies: enrichedCompanies,
      stats,
      current_period: currentPeriod,
    })
  } catch (error) {
    console.error('Client Companies API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
