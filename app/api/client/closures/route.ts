import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { getClosures, getClosure } from '@/lib/closure-store-db'

export const dynamic = 'force-dynamic'

// GET /api/client/closures?company_id=X&year=2026
// GET /api/client/closures?company_id=X&period=2026-01  (single month detail)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Single month detail
    if (period) {
      const closure = await getClosure(companyId, period)

      // Enrich with transaction and document summaries
      const [{ data: transactions }, { data: documents }, { data: invoices }] = await Promise.all([
        supabaseAdmin
          .from('bank_transactions')
          .select('amount, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, category, tax_impact, vat_impact')
          .eq('company_id', companyId)
          .eq('period', period),
        supabaseAdmin
          .from('documents')
          .select('id, status, ocr_status')
          .eq('company_id', companyId)
          .eq('period', period)
          .neq('type', 'bank_statement')
          .is('deleted_at', null),
        supabaseAdmin
          .from('invoices')
          .select('id, total_with_vat')
          .eq('company_id', companyId)
          .is('deleted_at', null),
      ])

      const txs = transactions || []
      const NON_TAXABLE = ['private_transfer', 'owner_deposit', 'loan_repayment', 'internal_transfer']

      let txTotal = 0, txMatched = 0, txUnmatched = 0, txPrivate = 0
      let totalTaxImpact = 0, totalVatImpact = 0

      for (const tx of txs) {
        txTotal++
        const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
        const isPrivate = NON_TAXABLE.includes(tx.category || '')
        if (isMatched) txMatched++
        else if (isPrivate) txPrivate++
        else {
          txUnmatched++
          totalTaxImpact += Number(tx.tax_impact) || 0
          totalVatImpact += Number(tx.vat_impact) || 0
        }
      }

      const docs = documents || []
      const docsTotal = docs.length
      const docsApproved = docs.filter(d => d.status === 'approved' || d.ocr_status === 'approved').length
      const docsPending = docsTotal - docsApproved

      const invsTotal = (invoices || []).length
      const invsMatched = txs.filter(t => t.amount > 0 && t.matched_invoice_id).length

      return NextResponse.json({
        closure: closure || {
          company_id: companyId,
          period,
          status: 'open',
          bank_statement_status: 'missing',
          expense_documents_status: 'missing',
          income_invoices_status: 'missing',
        },
        transactions_summary: { total: txTotal, matched: txMatched, unmatched: txUnmatched, private: txPrivate },
        documents_summary: { total: docsTotal, approved: docsApproved, pending: docsPending },
        invoices_summary: { total_income: invsTotal, matched: invsMatched, unmatched: Math.max(0, invsTotal - invsMatched) },
        tax_impact: {
          income_tax: Math.round(totalTaxImpact * 100) / 100,
          vat: Math.round(totalVatImpact * 100) / 100,
          total: Math.round((totalTaxImpact + totalVatImpact) * 100) / 100,
        },
      })
    }

    // Year overview
    const closures = await getClosures({ companyId })
    const yearClosures = closures.filter(c => c.period.startsWith(year))

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const isCurrentYear = Number(year) === currentYear

    let closed = 0, inProgress = 0, open = 0, future = 0
    for (let m = 1; m <= 12; m++) {
      const period = `${year}-${String(m).padStart(2, '0')}`
      const closure = yearClosures.find(c => c.period === period)

      if (isCurrentYear && m > currentMonth + 1) {
        future++
      } else if (!closure || closure.status === 'open') {
        open++
      } else if (closure.status === 'closed') {
        closed++
      } else {
        inProgress++
      }
    }

    return NextResponse.json({
      closures: yearClosures,
      year_summary: { total_months: 12, closed, in_progress: inProgress, open, future },
    })
  } catch (error) {
    console.error('[ClientClosures] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
