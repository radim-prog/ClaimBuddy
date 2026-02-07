import { NextResponse } from 'next/server'
import { mockCompanies, getClosures, getAllTasks } from '@/lib/mock-data'

// Force dynamic - this route reads mutable in-memory state
export const dynamic = 'force-dynamic'

// DEMO MODE - Using mock data instead of Supabase
export async function GET(request: Request) {
  try {
    // Return mock data for demo - všechna pole pro klienty
    const companies = mockCompanies.map(c => ({
      id: c.id,
      name: c.name,
      group_name: (c as any).group_name || null,
      ico: c.ico,
      dic: c.dic,
      legal_form: c.legal_form,
      vat_payer: c.vat_payer,
      vat_period: c.vat_period || null,
      owner_id: c.owner_id,
      street: c.street,
      city: c.city,
      zip: c.zip,
      health_insurance_company: (c as any).health_insurance_company || null,
      has_employees: (c as any).has_employees || false,
      employee_count: (c as any).employee_count || 0,
      data_box: (c as any).data_box || null,
      status: c.status || 'active',
      onboarding: (c as any).onboarding || null,
    }))

    const closures = getClosures()


    // Pro statistiky počítáme pouze uzávěrky do aktuálního měsíce (ne budoucí)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed pro porovnání s period

    const currentAndPastClosures = closures.filter(c => {
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    })

    // Calculate stats pouze pro aktuální a minulé měsíce
    const stats = {
      total: currentAndPastClosures.length,
      missing: currentAndPastClosures.filter(c =>
        c.bank_statement_status === 'missing' ||
        c.expense_documents_status === 'missing' ||
        c.income_invoices_status === 'missing'
      ).length,
      uploaded: currentAndPastClosures.filter(c =>
        (c.bank_statement_status === 'uploaded' ||
        c.expense_documents_status === 'uploaded' ||
        c.income_invoices_status === 'uploaded') &&
        // Nepočítat ty, které mají něco missing
        c.bank_statement_status !== 'missing' &&
        c.expense_documents_status !== 'missing' &&
        c.income_invoices_status !== 'missing'
      ).length,
      approved: currentAndPastClosures.filter(c =>
        c.bank_statement_status === 'approved' &&
        c.expense_documents_status === 'approved' &&
        c.income_invoices_status === 'approved'
      ).length,
    }

    const tasks = getAllTasks().map(t => ({
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
