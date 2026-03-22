import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/client/cash-book?company_id=X&period=2026-01
// Returns cash transactions with running balance (pokladní kniha)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period')

  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  const allowed = await canAccessCompany(userId, userRole, companyId, impersonate)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Get initial balance: sum of all transactions before the period
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

    // Get period transactions in chronological order
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

    // Compute running balance
    let balance = openingBalance
    const entries = (transactions || []).map(tx => {
      balance += tx.amount || 0
      return {
        ...tx,
        running_balance: Math.round(balance * 100) / 100,
      }
    })

    // Summary
    const totalIncome = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
    const totalExpense = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)

    return NextResponse.json({
      company_id: companyId,
      period: period || 'all',
      opening_balance: Math.round(openingBalance * 100) / 100,
      closing_balance: Math.round(balance * 100) / 100,
      total_income: Math.round(totalIncome * 100) / 100,
      total_expense: Math.round(totalExpense * 100) / 100,
      entries,
      count: entries.length,
    })
  } catch (error) {
    console.error('[CashBook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
