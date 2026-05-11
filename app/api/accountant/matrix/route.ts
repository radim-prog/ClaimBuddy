import { NextRequest, NextResponse } from 'next/server'
import { getAllCompanies } from '@/lib/company-store'
import { getClosures } from '@/lib/closure-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirmId, getFirmCompanyIds } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const module = new URL(request.url).searchParams.get('module')
  const firmId = getFirmId(request)
  const firmCompanyIds = firmId ? new Set(await getFirmCompanyIds(firmId)) : null

  try {
    const [allCompaniesRaw, closuresRaw, { data: groupsData }] = await Promise.all([
      getAllCompanies(firmId || undefined),
      getClosures(),
      supabaseAdmin
        .from('company_groups')
        .select('group_name, billing_company_id'),
    ])

    const allCompanies = firmCompanyIds
      ? allCompaniesRaw.filter(c => firmCompanyIds.has(c.id))
      : allCompaniesRaw
    const closures = firmCompanyIds
      ? closuresRaw.filter(c => firmCompanyIds.has(c.company_id))
      : closuresRaw

    // Claims module: dříve filtr „jen firmy s insurance_cases", ale to skrývalo
    // nově registrované klienty bez spisu. MVP 11.5.2026 — zobrazujeme všechny
    // firmy v claims režimu; admin si u registrovaného klienta sám založí spis.
    void module
    const filteredCompanies = allCompanies

    const companies = filteredCompanies.map(c => ({
      id: c.id,
      name: c.name,
      group_name: c.group_name || null,
      ico: c.ico,
      dic: c.dic,
      legal_form: c.legal_form,
      vat_payer: c.vat_payer,
      vat_period: c.vat_period || null,
      owner_id: c.owner_id,
      street: c.address?.street || null,
      city: c.address?.city || null,
      zip: c.address?.zip || null,
      health_insurance_company: null,
      has_employees: c.has_employees || false,
      employee_count: 0,
      data_box: null,
      status: c.status || 'active',
      monthly_reporting: c.monthly_reporting ?? true,
      billing_settings: c.billing_settings || null,
      managing_director: c.managing_director || null,
      onboarding: null,
    }))

    // Filter closures to current and past months only
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const currentAndPastClosures = closures.filter(c => {
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    })

    // Only count stats for companies with monthly reporting (exclude inactive + non-reporting)
    const reportingCompanyIds = new Set(
      allCompanies
        .filter(c => c.status !== 'inactive' && c.monthly_reporting !== false)
        .map(c => c.id)
    )
    const reportingClosures = currentAndPastClosures.filter(c => reportingCompanyIds.has(c.company_id))

    // Calculate stats
    const stats = {
      total: reportingClosures.length,
      missing: reportingClosures.filter(c =>
        c.bank_statement_status === 'missing' ||
        c.expense_documents_status === 'missing' ||
        c.income_invoices_status === 'missing'
      ).length,
      uploaded: reportingClosures.filter(c =>
        (c.bank_statement_status === 'uploaded' ||
        c.expense_documents_status === 'uploaded' ||
        c.income_invoices_status === 'uploaded') &&
        c.bank_statement_status !== 'missing' &&
        c.expense_documents_status !== 'missing' &&
        c.income_invoices_status !== 'missing'
      ).length,
      reviewed: reportingClosures.filter(c =>
        [c.bank_statement_status, c.expense_documents_status, c.income_invoices_status]
          .every(s => s === 'reviewed' || s === 'approved') &&
        !(c.bank_statement_status === 'approved' && c.expense_documents_status === 'approved' && c.income_invoices_status === 'approved')
      ).length,
      approved: reportingClosures.filter(c =>
        c.bank_statement_status === 'approved' &&
        c.expense_documents_status === 'approved' &&
        c.income_invoices_status === 'approved'
      ).length,
    }

    // Get tasks from Supabase
    let tasksQuery = supabaseAdmin
      .from('tasks')
      .select('id, title, status, due_date, company_id, company_name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (firmCompanyIds && firmCompanyIds.size > 0) {
      tasksQuery = tasksQuery.in('company_id', [...firmCompanyIds])
    }

    const { data: tasksData } = await tasksQuery

    const tasks = (tasksData ?? []).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      due_date: t.due_date || null,
      company_id: t.company_id,
      company_name: t.company_name || null,
    }))

    return NextResponse.json({
      companies,
      closures,
      tasks,
      stats,
      groups: (groupsData || []).map((g: any) => ({
        group_name: g.group_name,
        billing_company_id: g.billing_company_id,
      })),
    })
  } catch (error) {
    console.error('Master Matrix API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
