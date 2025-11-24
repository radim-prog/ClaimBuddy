import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        ico,
        dic,
        legal_form,
        vat_payer,
        address,
        email,
        phone,
        created_at
      `)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .order('name')

    if (companiesError) {
      console.error('Companies error:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Get monthly closures for current month for each company
    const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM

    const companyIds = companies.map(c => c.id)

    if (companyIds.length === 0) {
      return NextResponse.json({ companies: [], currentMonthStatus: [] })
    }

    const { data: closures, error: closuresError } = await supabase
      .from('monthly_closures')
      .select('*')
      .in('company_id', companyIds)
      .eq('period', currentPeriod)

    if (closuresError) {
      console.error('Closures error:', closuresError)
      // Continue without closures (non-critical)
    }

    // Enrich companies with closure status
    const enrichedCompanies = companies.map(company => {
      const closure = closures?.find(c => c.company_id === company.id)

      const missingDocs = closure ? [
        closure.bank_statement_status === 'missing' ? 'Výpis z účtu' : null,
        closure.expense_invoices_status === 'missing' ? 'Výdajové faktury' : null,
        closure.receipts_status === 'missing' ? 'Účtenky' : null,
        closure.income_invoices_status === 'missing' ? 'Příjmové faktury' : null,
      ].filter(Boolean) : []

      return {
        ...company,
        currentMonthStatus: {
          period: currentPeriod,
          missing_count: missingDocs.length,
          missing_types: missingDocs,
          all_uploaded: missingDocs.length === 0,
          bank_statement_status: closure?.bank_statement_status || 'missing',
          expense_invoices_status: closure?.expense_invoices_status || 'missing',
          receipts_status: closure?.receipts_status || 'missing',
          income_invoices_status: closure?.income_invoices_status || 'missing',
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
