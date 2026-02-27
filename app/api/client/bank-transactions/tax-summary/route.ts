import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    // Get all transactions for the year
    const { data: transactions, error } = await supabaseAdmin
      .from('bank_transactions')
      .select('period, amount, tax_impact, vat_impact, matched_document_id, matched_invoice_id, category')
      .eq('company_id', companyId)
      .like('period', `${year}-%`)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const txs = transactions || []

    // Monthly breakdown
    const monthlyMap = new Map<string, {
      total_income: number
      total_expense: number
      matched_count: number
      unmatched_count: number
      tax_impact: number
      vat_impact: number
    }>()

    for (let m = 1; m <= 12; m++) {
      const period = `${year}-${String(m).padStart(2, '0')}`
      monthlyMap.set(period, {
        total_income: 0,
        total_expense: 0,
        matched_count: 0,
        unmatched_count: 0,
        tax_impact: 0,
        vat_impact: 0,
      })
    }

    let yearTaxImpact = 0
    let yearVatImpact = 0
    let yearIncome = 0
    let yearExpense = 0
    let unmatchedExpenses = 0

    for (const tx of txs) {
      const period = tx.period || 'unknown'
      const monthly = monthlyMap.get(period)

      if (tx.amount > 0) {
        yearIncome += Number(tx.amount)
        if (monthly) monthly.total_income += Number(tx.amount)
      } else {
        yearExpense += Math.abs(Number(tx.amount))
        if (monthly) monthly.total_expense += Math.abs(Number(tx.amount))
      }

      const isMatched = tx.matched_document_id || tx.matched_invoice_id
      if (isMatched) {
        if (monthly) monthly.matched_count++
      } else {
        if (monthly) monthly.unmatched_count++
        if (tx.amount < 0) unmatchedExpenses++
      }

      yearTaxImpact += Number(tx.tax_impact) || 0
      yearVatImpact += Number(tx.vat_impact) || 0
      if (monthly) {
        monthly.tax_impact += Number(tx.tax_impact) || 0
        monthly.vat_impact += Number(tx.vat_impact) || 0
      }
    }

    // Current month summary
    const currentPeriod = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const currentMonth = monthlyMap.get(currentPeriod) || {
      total_income: 0,
      total_expense: 0,
      matched_count: 0,
      unmatched_count: 0,
      tax_impact: 0,
      vat_impact: 0,
    }

    const monthly = Array.from(monthlyMap.entries()).map(([period, data]) => ({
      period,
      ...data,
    }))

    return NextResponse.json({
      year: Number(year),
      current_month: {
        period: currentPeriod,
        ...currentMonth,
      },
      yearly: {
        total_income: yearIncome,
        total_expense: yearExpense,
        tax_impact: yearTaxImpact,
        vat_impact: yearVatImpact,
        total_impact: yearTaxImpact + yearVatImpact,
        unmatched_expenses: unmatchedExpenses,
        total_transactions: txs.length,
      },
      monthly,
    })
  } catch (error) {
    console.error('[TaxSummary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
