import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { calculateDetailedTaxImpact } from '@/lib/tax-impact'

export const dynamic = 'force-dynamic'

// GET /api/client/closures/unmatched?company_id=X&period=2026-01
// Returns unmatched expense documents and invoices with per-item tax impact
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

    // Get company info for tax calculations
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('legal_form, vat_payer')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch unmatched expense transactions (negative amount, no match)
    const { data: unmatchedTx, error: txError } = await supabaseAdmin
      .from('bank_transactions')
      .select('id, amount, transaction_date, variable_symbol, counterparty_name, counterparty_account, description, category')
      .eq('company_id', companyId)
      .eq('period', period)
      .lt('amount', 0)
      .is('matched_document_id', null)
      .is('matched_dohoda_mesic_id', null)
      .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')
      .order('amount', { ascending: true })
      .limit(500)

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // Fetch unmatched income transactions (positive amount, no invoice match)
    const { data: unmatchedIncome, error: incError } = await supabaseAdmin
      .from('bank_transactions')
      .select('id, amount, transaction_date, variable_symbol, counterparty_name, counterparty_account, description, category')
      .eq('company_id', companyId)
      .eq('period', period)
      .gt('amount', 0)
      .is('matched_invoice_id', null)
      .not('category', 'in', '("other_taxable","private_transfer","owner_deposit","internal_transfer")')
      .order('amount', { ascending: false })
      .limit(500)

    if (incError) {
      return NextResponse.json({ error: incError.message }, { status: 500 })
    }

    // Calculate tax impact per unmatched expense
    const expenses = (unmatchedTx || []).map(tx => {
      const impact = calculateDetailedTaxImpact(tx.amount, company.legal_form, company.vat_payer)
      return {
        ...tx,
        tax_impact: impact,
      }
    })

    const income = (unmatchedIncome || []).map(tx => ({
      ...tx,
      tax_impact: null, // income transactions don't have "missing doc" tax impact
    }))

    // Aggregate tax impact
    const totalTaxImpact = expenses.reduce((acc, e) => ({
      income_tax: acc.income_tax + e.tax_impact.income_tax,
      social_insurance: acc.social_insurance + e.tax_impact.social_insurance,
      health_insurance: acc.health_insurance + e.tax_impact.health_insurance,
      vat: acc.vat + e.tax_impact.vat,
      total: acc.total + e.tax_impact.total,
    }), { income_tax: 0, social_insurance: 0, health_insurance: 0, vat: 0, total: 0 })

    return NextResponse.json({
      period,
      expenses: {
        transactions: expenses,
        count: expenses.length,
        total_amount: Math.round(expenses.reduce((s, e) => s + Math.abs(e.amount), 0) * 100) / 100,
      },
      income: {
        transactions: income,
        count: income.length,
        total_amount: Math.round(income.reduce((s, i) => s + i.amount, 0) * 100) / 100,
      },
      tax_impact: {
        income_tax: Math.round(totalTaxImpact.income_tax * 100) / 100,
        social_insurance: Math.round(totalTaxImpact.social_insurance * 100) / 100,
        health_insurance: Math.round(totalTaxImpact.health_insurance * 100) / 100,
        vat: Math.round(totalTaxImpact.vat * 100) / 100,
        total: Math.round(totalTaxImpact.total * 100) / 100,
      },
    })
  } catch (error) {
    console.error('[ClosureUnmatched] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
