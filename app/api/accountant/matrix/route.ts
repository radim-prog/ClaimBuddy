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

    // Check if user is accountant
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden - Accountant only' }, { status: 403 })
    }

    // Get all companies assigned to this accountant
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, ico, owner_id')
      .eq('assigned_accountant_id', user.id)
      .is('deleted_at', null)
      .order('name')

    if (companiesError) {
      console.error('Companies error:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Get all monthly closures for these companies
    const companyIds = companies.map(c => c.id)

    if (companyIds.length === 0) {
      return NextResponse.json({ companies: [], closures: [] })
    }

    const { data: closures, error: closuresError } = await supabase
      .from('monthly_closures')
      .select('*')
      .in('company_id', companyIds)
      .order('period', { ascending: true })

    if (closuresError) {
      console.error('Closures error:', closuresError)
      return NextResponse.json({ error: 'Failed to fetch closures' }, { status: 500 })
    }

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
