import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getClosures } from '@/lib/closure-store-db'
import { createCompany, getCompanyByIco } from '@/lib/company-store'
import { validateIco, lookupByIco } from '@/lib/ares'
import { getUserName } from '@/lib/request-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userName = getUserName(request, 'Klient')
  const impersonateCompany = request.headers.get('x-impersonate-company')

  const userRole = request.headers.get('x-user-role')

  try {
    let companies: any[] = []

    const companySelect = 'id, name, ico, dic, legal_form, vat_payer, vat_period, has_employees, status, address, managing_director, portal_sections, assigned_accountant_id'

    if (impersonateCompany) {
      // Impersonation mode - load specific company
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select(companySelect)
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
        .select(companySelect)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('name')

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
      }
      companies = data ?? []
    } else {
      // Real client - load by owner_id (include pending_review so client sees their submitted companies)
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select(companySelect)
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .in('status', ['active', 'pending_review', 'onboarding'])
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

    // Lookup accountant names for companies that have one assigned
    const accountantIds = [...new Set(companies.map(c => c.assigned_accountant_id).filter(Boolean))]
    const accountantNames: Record<string, string> = {}
    if (accountantIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', accountantIds)
      for (const u of users || []) {
        accountantNames[u.id] = u.name
      }
    }

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
        vat_period: company.vat_period || null,
        has_employees: company.has_employees,
        status: company.status,
        address: company.address,
        managing_director: company.managing_director || null,
        portal_sections: company.portal_sections || {},
        has_accountant: !!company.assigned_accountant_id,
        accountant_name: company.assigned_accountant_id ? (accountantNames[company.assigned_accountant_id] || null) : null,
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

// POST: Client registers a new company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { ico, name, email, phone, managing_director } = body as {
      ico: string
      name?: string
      email?: string
      phone?: string
      managing_director?: string
    }

    if (!ico) {
      return NextResponse.json({ error: 'IČO je povinné' }, { status: 400 })
    }

    // Validate ICO format
    if (!validateIco(ico)) {
      return NextResponse.json({ error: 'Neplatné IČO (musí být 8 číslic s platným kontrolním součtem)' }, { status: 400 })
    }

    // Check duplicate
    const existing = await getCompanyByIco(ico)
    if (existing) {
      return NextResponse.json({ error: 'Firma s tímto IČO již v systému existuje' }, { status: 409 })
    }

    // ARES lookup for auto-fill
    let aresData = null
    try {
      aresData = await lookupByIco(ico)
    } catch {
      // ARES may be down — continue with manual data
    }

    const companyName = name || aresData?.name || `Firma ${ico}`
    const address = aresData?.address || { street: '', city: '', zip: '' }

    // Check if user has an assigned accountant (via existing companies with accountant)
    const { data: existingWithAccountant } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .not('assigned_accountant_id', 'is', null)
      .is('deleted_at', null)
      .limit(1)

    // iDoklad mode: client without accountant → company goes straight to active
    // Client with accountant → pending_review (accountant must approve)
    const hasAccountant = (existingWithAccountant?.length ?? 0) > 0
    const status = hasAccountant ? 'pending_review' : 'active'

    const company = await createCompany({
      name: companyName,
      ico,
      dic: aresData?.dic || null,
      legal_form: aresData?.legal_form || 'OSVČ',
      vat_payer: aresData?.vat_payer || false,
      address,
      email: email || null,
      phone: phone || null,
      managing_director: managing_director || null,
      status,
      owner_id: userId,
    })

    return NextResponse.json({ company, ares: aresData }, { status: 201 })
  } catch (error) {
    console.error('Client POST company error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create company'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
