import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { NON_TAXABLE_CATEGORIES } from '@/lib/types/bank-matching'

export const dynamic = 'force-dynamic'

// GET /api/client/closures/yearly-summary?company_id=X&year=2026
// Returns 12-month overview: completion %, financials, tax impact per month
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const year = searchParams.get('year')

    if (!companyId || !year) {
      return NextResponse.json({ error: 'Missing company_id or year' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all closures for the year
    const { data: closures } = await supabaseAdmin
      .from('monthly_closures')
      .select('period, status, bank_statement_status, expense_documents_status, income_invoices_status, cash_documents_status, cash_income, cash_expense')
      .eq('company_id', companyId)
      .gte('period', `${year}-01`)
      .lte('period', `${year}-12`)
      .order('period')

    // Fetch all transactions for the year
    const { data: transactions } = await supabaseAdmin
      .from('bank_transactions')
      .select('period, amount, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, match_confidence, match_method, category, tax_impact, vat_impact, social_impact, health_impact, total_impact')
      .eq('company_id', companyId)
      .gte('period', `${year}-01`)
      .lte('period', `${year}-12`)

    const txs = transactions || []
    const closureMap = new Map((closures || []).map(c => [c.period, c]))

    // Build per-month summary
    const months = []
    let yearTotalIncome = 0, yearTotalExpense = 0
    let yearTaxImpact = 0, yearVatImpact = 0, yearSocialImpact = 0, yearHealthImpact = 0, yearTotalImpact = 0
    let yearMatchedCount = 0, yearUnmatchedCount = 0, yearTotalCount = 0

    for (let m = 1; m <= 12; m++) {
      const period = `${year}-${String(m).padStart(2, '0')}`
      const monthTxs = txs.filter(t => t.period === period)
      const closure = closureMap.get(period)

      let income = 0, expense = 0
      let matched = 0, unmatched = 0, unmatchedExpenses = 0, privateCount = 0
      let taxImpact = 0, vatImpact = 0, socialImpact = 0, healthImpact = 0, totalImpact = 0

      for (const tx of monthTxs) {
        const amount = Number(tx.amount) || 0
        if (amount > 0) income += amount
        else expense += Math.abs(amount)

        const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
        const isPrivate = NON_TAXABLE_CATEGORIES.includes(tx.category as any)

        if (isMatched) {
          matched++
        } else if (isPrivate) {
          privateCount++
        } else {
          unmatched++
          if (amount < 0) unmatchedExpenses++
          taxImpact += Number(tx.tax_impact) || 0
          vatImpact += Number(tx.vat_impact) || 0
          socialImpact += Number(tx.social_impact) || 0
          healthImpact += Number(tx.health_impact) || 0
          totalImpact += Number(tx.total_impact) || 0
        }
      }

      const totalActionable = monthTxs.length - privateCount
      const progress = totalActionable > 0
        ? Math.round((matched / totalActionable) * 100)
        : 0

      yearTotalIncome += income
      yearTotalExpense += expense
      yearTaxImpact += taxImpact
      yearVatImpact += vatImpact
      yearSocialImpact += socialImpact
      yearHealthImpact += healthImpact
      yearTotalImpact += totalImpact
      yearMatchedCount += matched
      yearUnmatchedCount += unmatched
      yearTotalCount += monthTxs.length

      months.push({
        period,
        status: closure?.status || (monthTxs.length > 0 ? 'open' : null),
        progress,
        financials: {
          income: Math.round(income * 100) / 100,
          expense: Math.round(expense * 100) / 100,
          cash_income: closure?.cash_income ?? 0,
          cash_expense: closure?.cash_expense ?? 0,
          net: Math.round((income - expense) * 100) / 100,
        },
        matching: {
          total: monthTxs.length,
          matched,
          unmatched,
          unmatched_expenses: unmatchedExpenses,
          private: privateCount,
        },
        tax_impact: {
          income_tax: Math.round(taxImpact * 100) / 100,
          vat: Math.round(vatImpact * 100) / 100,
          social_insurance: Math.round(socialImpact * 100) / 100,
          health_insurance: Math.round(healthImpact * 100) / 100,
          total: Math.round(totalImpact * 100) / 100,
        },
      })
    }

    return NextResponse.json({
      year: parseInt(year),
      company_id: companyId,
      months,
      totals: {
        income: Math.round(yearTotalIncome * 100) / 100,
        expense: Math.round(yearTotalExpense * 100) / 100,
        net: Math.round((yearTotalIncome - yearTotalExpense) * 100) / 100,
        transactions: yearTotalCount,
        matched: yearMatchedCount,
        unmatched: yearUnmatchedCount,
        overall_progress: yearTotalCount > 0
          ? Math.round((yearMatchedCount / (yearMatchedCount + yearUnmatchedCount || 1)) * 100)
          : 0,
      },
      tax_impact: {
        income_tax: Math.round(yearTaxImpact * 100) / 100,
        vat: Math.round(yearVatImpact * 100) / 100,
        social_insurance: Math.round(yearSocialImpact * 100) / 100,
        health_insurance: Math.round(yearHealthImpact * 100) / 100,
        total: Math.round(yearTotalImpact * 100) / 100,
      },
    })
  } catch (error) {
    console.error('[ClosureYearlySummary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
