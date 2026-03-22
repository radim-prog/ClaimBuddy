import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { getClosureDetail } from '@/lib/closure-store-db'
import { NON_TAXABLE_CATEGORIES } from '@/lib/types/bank-matching'

export const dynamic = 'force-dynamic'

// GET /api/client/closures/summary?company_id=X&period=2026-01
// Returns: progress, financials, matching breakdown, tax impact, actions
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')

    if (!companyId || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch closure + cash totals
    const closureDetail = await getClosureDetail(companyId, period)

    // Fetch transactions, documents, invoices in parallel
    const [{ data: transactions }, { data: documents }, { data: invoices }] = await Promise.all([
      supabaseAdmin
        .from('bank_transactions')
        .select('id, amount, category, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, match_confidence, match_method, tax_impact, vat_impact, social_impact, health_impact, total_impact, is_recurring')
        .eq('company_id', companyId)
        .eq('period', period),
      supabaseAdmin
        .from('documents')
        .select('id, status, type, ocr_status')
        .eq('company_id', companyId)
        .eq('period', period)
        .neq('type', 'bank_statement')
        .is('deleted_at', null),
      supabaseAdmin
        .from('invoices')
        .select('id, total_with_vat, status')
        .eq('company_id', companyId)
        .is('deleted_at', null),
    ])

    const txs = transactions || []
    const docs = documents || []

    // Matching breakdown
    let totalIncome = 0, totalExpense = 0
    let matchedCount = 0, unmatchedCount = 0, privateCount = 0, recurringCount = 0
    let autoMatchedCount = 0, manualMatchedCount = 0, suggestedCount = 0
    let taxImpactSum = 0, vatImpactSum = 0, socialImpactSum = 0, healthImpactSum = 0, totalImpactSum = 0

    for (const tx of txs) {
      const amount = Number(tx.amount) || 0
      if (amount > 0) totalIncome += amount
      else totalExpense += Math.abs(amount)

      const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
      const isPrivate = NON_TAXABLE_CATEGORIES.includes(tx.category as any)

      if (isMatched) {
        matchedCount++
        const conf = Number(tx.match_confidence) || 0
        if (tx.match_method === 'manual') manualMatchedCount++
        else if (conf >= 0.80) autoMatchedCount++
        else suggestedCount++
      } else if (isPrivate) {
        privateCount++
      } else {
        unmatchedCount++
        taxImpactSum += Number(tx.tax_impact) || 0
        vatImpactSum += Number(tx.vat_impact) || 0
        socialImpactSum += Number(tx.social_impact) || 0
        healthImpactSum += Number(tx.health_impact) || 0
        totalImpactSum += Number(tx.total_impact) || 0
      }

      if (tx.is_recurring) recurringCount++
    }

    // Documents breakdown
    const docsTotal = docs.length
    const docsApproved = docs.filter(d => d.status === 'approved' || d.ocr_status === 'approved').length

    // Progress calculation (0-100)
    const totalActionable = txs.length - privateCount
    const progress = totalActionable > 0
      ? Math.round((matchedCount / totalActionable) * 100)
      : 100

    // Pending actions
    const actions: string[] = []
    const closure = closureDetail
    if (!closure || closure.bank_statement_status === 'missing') {
      actions.push('upload_bank_statement')
    }
    if (unmatchedCount > 0) {
      actions.push('match_transactions')
    }
    if (docsTotal > docsApproved) {
      actions.push('review_documents')
    }

    return NextResponse.json({
      period,
      closure: closure || {
        company_id: companyId,
        period,
        status: 'open',
        bank_statement_status: 'missing',
        expense_documents_status: 'missing',
        income_invoices_status: 'missing',
        cash_documents_status: 'not_applicable',
      },
      progress,
      financials: {
        income: Math.round(totalIncome * 100) / 100,
        expense: Math.round(totalExpense * 100) / 100,
        cash_income: closure?.cash_income ?? 0,
        cash_expense: closure?.cash_expense ?? 0,
        net: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
      matching: {
        total: txs.length,
        matched: matchedCount,
        auto_matched: autoMatchedCount,
        manual_matched: manualMatchedCount,
        suggested: suggestedCount,
        unmatched: unmatchedCount,
        private: privateCount,
        recurring: recurringCount,
      },
      documents: {
        total: docsTotal,
        approved: docsApproved,
        pending: docsTotal - docsApproved,
      },
      tax_impact: {
        income_tax: Math.round(taxImpactSum * 100) / 100,
        vat: Math.round(vatImpactSum * 100) / 100,
        social_insurance: Math.round(socialImpactSum * 100) / 100,
        health_insurance: Math.round(healthImpactSum * 100) / 100,
        total: Math.round(totalImpactSum * 100) / 100,
      },
      actions,
    })
  } catch (error) {
    console.error('[ClosureSummary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
