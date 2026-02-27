import { NextRequest, NextResponse } from 'next/server'
import { getAllCompanies } from '@/lib/company-store'
import { getClosures } from '@/lib/closure-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [allCompanies, closures] = await Promise.all([
      getAllCompanies(),
      getClosures(),
    ])

    const companies = allCompanies.map(c => ({
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
      approved: reportingClosures.filter(c =>
        c.bank_statement_status === 'approved' &&
        c.expense_documents_status === 'approved' &&
        c.income_invoices_status === 'approved'
      ).length,
    }

    // Get tasks from Supabase
    const { data: tasksData } = await supabaseAdmin
      .from('tasks')
      .select('id, title, status, due_date, company_id, company_name')
      .order('created_at', { ascending: false })
      .limit(200)

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
    })
  } catch (error) {
    console.error('Master Matrix API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
