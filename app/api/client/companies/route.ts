import { NextResponse } from 'next/server'
import { mockCompanies, getClosures } from '@/lib/mock-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('owner_id')
    const demo = searchParams.get('demo')

    // Filter companies by owner_id, or use first 3 for demo
    let companies: any[]
    if (ownerId) {
      companies = (mockCompanies as any[]).filter(c => c.owner_id === ownerId && c.status === 'active')
    } else if (demo === 'true') {
      // Demo: show first 3 active companies
      companies = (mockCompanies as any[]).filter(c => c.status === 'active').slice(0, 3)
    } else {
      // Fallback: first 3
      companies = (mockCompanies as any[]).filter(c => c.status === 'active').slice(0, 3)
    }

    // Dynamic current period
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentYear = now.getFullYear()

    // Get closures for current month
    const currentClosures = getClosures().filter(c =>
      companies.some(comp => comp.id === c.company_id) &&
      c.period === currentPeriod
    )

    // Get closures for full year (all months)
    const yearClosures = getClosures().filter(c =>
      companies.some(comp => comp.id === c.company_id) &&
      c.period.startsWith(String(currentYear))
    )

    // Enrich companies with current month closure status
    const enrichedCompanies = companies.map(company => {
      const closure = currentClosures.find(c => c.company_id === company.id)

      const missingDocs = closure ? [
        closure.bank_statement_status === 'missing' ? 'Výpis z účtu' : null,
        closure.expense_documents_status === 'missing' ? 'Nákladové doklady' : null,
        closure.income_invoices_status === 'missing' ? 'Příjmové faktury' : null,
      ].filter(Boolean) : []

      return {
        id: company.id,
        name: company.name,
        ico: company.ico,
        dic: company.dic,
        legal_form: company.legal_form,
        vat_payer: company.vat_payer,
        has_employees: company.has_employees,
        status: company.status,
        address: company.address,
        currentMonthStatus: {
          period: currentPeriod,
          missing_count: missingDocs.length,
          missing_types: missingDocs,
          all_uploaded: missingDocs.length === 0,
          bank_statement_status: closure?.bank_statement_status || 'missing',
          expense_documents_status: closure?.expense_documents_status || 'missing',
          income_invoices_status: closure?.income_invoices_status || 'missing',
        }
      }
    })

    // Stats
    const stats = {
      total_companies: companies.length,
      companies_with_missing_docs: enrichedCompanies.filter(c => c.currentMonthStatus.missing_count > 0).length,
      total_missing_docs: enrichedCompanies.reduce((sum, c) => sum + c.currentMonthStatus.missing_count, 0),
    }

    return NextResponse.json({
      companies: enrichedCompanies,
      closures: yearClosures.map(c => ({
        company_id: c.company_id,
        period: c.period,
        bank_statement_status: c.bank_statement_status,
        expense_documents_status: c.expense_documents_status,
        income_invoices_status: c.income_invoices_status,
      })),
      stats,
      current_period: currentPeriod,
      user_name: 'Karel Novák', // TODO: get from auth session
    })
  } catch (error) {
    console.error('Client Companies API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
