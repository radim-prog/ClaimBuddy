import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/accountant/cash-book?company_id=X&period=2026-01
// Read-only cash book view for accountants
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period')

  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  try {
    // Opening balance: sum of all transactions before the period
    let openingBalance = 0
    if (period) {
      const { data: prior } = await supabaseAdmin
        .from('cash_transactions')
        .select('amount')
        .eq('company_id', companyId)
        .lt('period', period)

      if (prior) {
        openingBalance = prior.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      }
    }

    // Get company name
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, ico')
      .eq('id', companyId)
      .single()

    // Fetch transactions
    let query = supabaseAdmin
      .from('cash_transactions')
      .select('id, doc_type, doc_number, transaction_date, amount, description, counterparty_name, category, period, created_by')
      .eq('company_id', companyId)
      .order('transaction_date', { ascending: true })
      .order('doc_number', { ascending: true })

    if (period) {
      query = query.eq('period', period)
    }

    const { data: transactions, error } = await query.limit(1000)
    if (error) throw error

    // Running balance
    let balance = openingBalance
    const entries = (transactions || []).map(tx => {
      balance += tx.amount || 0
      return {
        ...tx,
        running_balance: Math.round(balance * 100) / 100,
      }
    })

    const totalIncome = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
    const totalExpense = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)

    return NextResponse.json({
      company_id: companyId,
      company_name: company?.name || '',
      company_ico: company?.ico || '',
      period: period || 'all',
      opening_balance: Math.round(openingBalance * 100) / 100,
      closing_balance: Math.round(balance * 100) / 100,
      total_income: Math.round(totalIncome * 100) / 100,
      total_expense: Math.round(totalExpense * 100) / 100,
      entries,
      count: entries.length,
    })
  } catch (error) {
    console.error('[AccountantCashBook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
