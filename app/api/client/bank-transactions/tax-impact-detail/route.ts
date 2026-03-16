import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { calculateYearlyTaxImpact } from '@/lib/tax-impact'

export const dynamic = 'force-dynamic'

// GET: Detailed cumulative tax impact with monthly breakdown
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

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get company legal form and VAT status
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('legal_form, vat_payer')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all expense transactions for the year
    const { data: transactions, error } = await supabaseAdmin
      .from('bank_transactions')
      .select('id, period, amount, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, category, counterparty_name, description, transaction_date')
      .eq('company_id', companyId)
      .like('period', `${year}-%`)
      .lt('amount', 0) // only expenses
      .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const txs = (transactions || []).map(tx => ({
      ...tx,
      period: tx.period || `${year}-01`,
      amount: Number(tx.amount),
      matched: !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id),
    }))

    const yearlyImpact = calculateYearlyTaxImpact(txs, company.legal_form, company.vat_payer)

    // Also include unmatched transaction details per month for accordion
    const unmatchedByMonth = new Map<string, Array<{
      id: string
      amount: number
      counterparty_name: string | null
      description: string | null
      transaction_date: string | null
    }>>()

    for (const tx of txs) {
      if (tx.matched) continue
      if (!unmatchedByMonth.has(tx.period)) {
        unmatchedByMonth.set(tx.period, [])
      }
      unmatchedByMonth.get(tx.period)!.push({
        id: tx.id,
        amount: tx.amount,
        counterparty_name: tx.counterparty_name,
        description: tx.description,
        transaction_date: tx.transaction_date,
      })
    }

    return NextResponse.json({
      ...yearlyImpact,
      unmatched_transactions: Object.fromEntries(unmatchedByMonth),
    })
  } catch (error) {
    console.error('[TaxImpactDetail] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
