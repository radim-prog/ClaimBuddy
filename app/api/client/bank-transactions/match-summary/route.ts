import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/client/bank-transactions/match-summary?company_id=X&period=YYYY-MM
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')

    if (!companyId || !period) {
      return NextResponse.json({ error: 'company_id and period required' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: transactions } = await supabaseAdmin
      .from('bank_transactions')
      .select('amount, category, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, tax_impact, vat_impact')
      .eq('company_id', companyId)
      .eq('period', period)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        period,
        total_transactions: 0,
        income: { total: 0, matched: 0, unmatched: 0 },
        expense: { total: 0, matched: 0, unmatched: 0, private_or_deposit: 0 },
        total_tax_impact: 0,
        total_vat_impact: 0,
      })
    }

    const NON_TAXABLE = ['private_transfer', 'owner_deposit', 'loan_repayment', 'internal_transfer']

    let incomeTotal = 0, incomeMatched = 0, incomeUnmatched = 0
    let expenseTotal = 0, expenseMatched = 0, expenseUnmatched = 0, expensePrivate = 0
    let totalTaxImpact = 0, totalVatImpact = 0

    for (const tx of transactions) {
      const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
      const isPrivate = NON_TAXABLE.includes(tx.category || '')

      if (tx.amount > 0) {
        incomeTotal++
        if (isMatched) incomeMatched++
        else incomeUnmatched++
      } else {
        expenseTotal++
        if (isPrivate) {
          expensePrivate++
        } else if (isMatched) {
          expenseMatched++
        } else {
          expenseUnmatched++
          totalTaxImpact += Number(tx.tax_impact) || 0
          totalVatImpact += Number(tx.vat_impact) || 0
        }
      }
    }

    return NextResponse.json({
      period,
      total_transactions: transactions.length,
      income: { total: incomeTotal, matched: incomeMatched, unmatched: incomeUnmatched },
      expense: { total: expenseTotal, matched: expenseMatched, unmatched: expenseUnmatched, private_or_deposit: expensePrivate },
      total_tax_impact: Math.round(totalTaxImpact * 100) / 100,
      total_vat_impact: Math.round(totalVatImpact * 100) / 100,
    })
  } catch (error) {
    console.error('[MatchSummary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
