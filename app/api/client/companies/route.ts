import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getClosures } from '@/lib/closure-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userName = request.headers.get('x-user-name') || 'Klient'
  const impersonateCompany = request.headers.get('x-impersonate-company')

  const userRole = request.headers.get('x-user-role')

  try {
    let companies: any[] = []

    if (impersonateCompany) {
      // Impersonation mode - load specific company
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('id, name, ico, dic, legal_form, vat_payer, has_employees, status, address')
        .eq('id', impersonateCompany)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      companies = [data]
    } else if (userRole === 'admin' || userRole === 'accountant') {
      // Admin/accountant browsing client portal without impersonation — show all active companies
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('id, name, ico, dic, legal_form, vat_payer, has_employees, status, address')
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('name')

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
      }
      companies = data ?? []
    } else {
      // Real client - load by owner_id
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('id, name, ico, dic, legal_form, vat_payer, has_employees, status, address')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('name')

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
      }
      companies = data ?? []
    }

    // Load closures for these companies
    const companyIds = new Set(companies.map(c => c.id))
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentYear = now.getFullYear()

    const allClosures = await getClosures()

    const currentClosures = allClosures.filter(c =>
      companyIds.has(c.company_id) && c.period === currentPeriod
    )

    const yearClosures = allClosures.filter(c =>
      companyIds.has(c.company_id) && c.period.startsWith(String(currentYear))
    )

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

    return NextResponse.json({
      companies: enrichedCompanies,
      closures: yearClosures.map(c => ({
        company_id: c.company_id,
        period: c.period,
        bank_statement_status: c.bank_statement_status,
        expense_documents_status: c.expense_documents_status,
        income_invoices_status: c.income_invoices_status,
      })),
      current_period: currentPeriod,
      user_id: userId,
      user_name: userName,
    })
  } catch (error) {
    console.error('Client Companies API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
