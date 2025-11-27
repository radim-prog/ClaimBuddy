import { NextResponse } from 'next/server'
import { mockCompanies, mockMonthlyClosures } from '@/lib/mock-data'

// DEMO MODE - Using mock data instead of Supabase
export async function GET(request: Request) {
  try {
    // Return mock data for demo
    const companies = mockCompanies.map(c => ({
      id: c.id,
      name: c.name,
      ico: c.ico,
      owner_id: c.owner_id
    }))

    const closures = mockMonthlyClosures

    // Calculate stats
    const stats = {
      total: closures.length,
      missing: closures.filter(c =>
        c.bank_statement_status === 'missing' ||
        c.expense_invoices_status === 'missing' ||
        c.receipts_status === 'missing' ||
        c.income_invoices_status === 'missing'
      ).length,
      uploaded: closures.filter(c =>
        c.bank_statement_status === 'uploaded' ||
        c.expense_invoices_status === 'uploaded' ||
        c.receipts_status === 'uploaded' ||
        c.income_invoices_status === 'uploaded'
      ).length,
      approved: closures.filter(c =>
        c.bank_statement_status === 'approved' &&
        c.expense_invoices_status === 'approved' &&
        c.receipts_status === 'approved' &&
        c.income_invoices_status === 'approved'
      ).length,
    }

    return NextResponse.json({
      companies,
      closures,
      stats,
    })
  } catch (error) {
    console.error('Master Matrix API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
