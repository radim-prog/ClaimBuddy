import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { upsertClosureField } from '@/lib/closure-store-db'
import { autoMatchTransaction, calculateTaxImpact } from '@/lib/bank-matching'
import { bankStatementConfirmSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// POST /api/client/bank-statements/confirm
// Confirm a bank statement: categorize transactions, update tax_period_data, advance closure
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = bankStatementConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const { company_id, period, categories } = parsed.data

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, company_id, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Apply categories if provided
    if (categories && Object.keys(categories).length > 0) {
      for (const [txId, category] of Object.entries(categories)) {
        await supabaseAdmin
          .from('bank_transactions')
          .update({ category })
          .eq('id', txId)
          .eq('company_id', company_id)
      }
    }

    // 2. Compute revenue & expenses from confirmed transactions
    const { data: transactions } = await supabaseAdmin
      .from('bank_transactions')
      .select('amount, category, tax_impact, vat_impact, matched_document_id, matched_invoice_id')
      .eq('company_id', company_id)
      .eq('period', period)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions for this period' }, { status: 404 })
    }

    const NON_TAXABLE_CATEGORIES = ['private_transfer', 'owner_deposit', 'loan_repayment', 'internal_transfer']

    let revenue = 0
    let expenses = 0
    let vatOutput = 0
    let vatInput = 0

    for (const tx of transactions) {
      const cat = tx.category || ''
      if (NON_TAXABLE_CATEGORIES.includes(cat)) continue

      if (tx.amount > 0) {
        revenue += tx.amount
      } else {
        expenses += Math.abs(tx.amount)
        // VAT input only for matched expenses (have document)
        if (tx.matched_document_id && tx.vat_impact) {
          vatInput += Math.abs(tx.vat_impact)
        }
      }
    }

    // VAT output approximate from income
    // (simplified — real VAT comes from invoices, this is estimate)
    vatOutput = Math.round(revenue / 1.21 * 0.21 * 100) / 100

    // 3. Upsert tax_period_data
    const { data: existingTpd } = await supabaseAdmin
      .from('tax_period_data')
      .select('id')
      .eq('company_id', company_id)
      .eq('period', period)
      .single()

    if (existingTpd) {
      await supabaseAdmin
        .from('tax_period_data')
        .update({
          revenue: Math.round(revenue * 100) / 100,
          expenses: Math.round(expenses * 100) / 100,
          vat_output: Math.round(vatOutput * 100) / 100,
          vat_input: Math.round(vatInput * 100) / 100,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTpd.id)
    } else {
      await supabaseAdmin
        .from('tax_period_data')
        .insert({
          company_id,
          period,
          revenue: Math.round(revenue * 100) / 100,
          expenses: Math.round(expenses * 100) / 100,
          vat_output: Math.round(vatOutput * 100) / 100,
          vat_input: Math.round(vatInput * 100) / 100,
          updated_by: userId,
        })
    }

    // 4. Advance closure — bank_statement_status → 'approved'
    await upsertClosureField(company_id, period, 'bank_statement_status', 'approved', userId)

    // 5. Inline auto-match for this period's unmatched transactions
    const { data: unmatchedTxs } = await supabaseAdmin
      .from('bank_transactions')
      .select('*')
      .eq('company_id', company_id)
      .eq('period', period)
      .is('matched_document_id', null)
      .is('matched_invoice_id', null)
      .limit(500)

    let matchedCount = 0
    if (unmatchedTxs && unmatchedTxs.length > 0) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('legal_form, vat_payer')
        .eq('id', company_id)
        .single()

      const [{ data: docs }, { data: invs }] = await Promise.all([
        supabaseAdmin
          .from('documents')
          .select('id, ocr_data, supplier_name, supplier_ico')
          .eq('company_id', company_id)
          .neq('type', 'bank_statement')
          .is('deleted_at', null)
          .limit(500),
        supabaseAdmin
          .from('invoices')
          .select('id, variable_symbol, total_with_vat, issue_date, partner')
          .eq('company_id', company_id)
          .is('deleted_at', null)
          .limit(500),
      ])

      const matchableDocs = (docs || []).map(d => ({
        id: d.id,
        variable_symbol: d.ocr_data?.variable_symbol || null,
        total_with_vat: d.ocr_data?.total_amount || d.ocr_data?.total_with_vat || null,
        date_issued: d.ocr_data?.date_issued || null,
        supplier_name: d.supplier_name || d.ocr_data?.supplier_name || null,
        supplier_ico: d.supplier_ico || d.ocr_data?.supplier_ico || null,
      }))

      const matchableInvs = (invs || []).map(i => ({
        id: i.id,
        variable_symbol: i.variable_symbol,
        total_with_vat: i.total_with_vat,
        issue_date: i.issue_date,
        partner: i.partner,
      }))

      for (const tx of unmatchedTxs) {
        const match = autoMatchTransaction(
          {
            id: tx.id,
            amount: tx.amount,
            variable_symbol: tx.variable_symbol,
            counterparty_name: tx.counterparty_name,
            counterparty_account: tx.counterparty_account,
            transaction_date: tx.transaction_date,
            description: tx.description,
          },
          matchableDocs,
          matchableInvs
        )

        if (match) {
          await supabaseAdmin
            .from('bank_transactions')
            .update({
              matched_document_id: match.document_id || null,
              matched_invoice_id: match.invoice_id || null,
              match_confidence: match.confidence,
              match_method: match.method,
              tax_impact: 0,
              vat_impact: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tx.id)
          matchedCount++
        } else if (tx.amount < 0 && company) {
          const impact = calculateTaxImpact(tx.amount, company.legal_form, company.vat_payer)
          await supabaseAdmin
            .from('bank_transactions')
            .update({ tax_impact: impact.tax, vat_impact: impact.vat, updated_at: new Date().toISOString() })
            .eq('id', tx.id)
        }
      }
    }

    // 6. Re-check unmatched expenses after auto-match
    const { count: unmatchedExpenses } = await supabaseAdmin
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('period', period)
      .lt('amount', 0)
      .is('matched_document_id', null)
      .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')

    if ((unmatchedExpenses || 0) === 0) {
      await upsertClosureField(company_id, period, 'expense_documents_status', 'approved', userId)
    }

    return NextResponse.json({
      success: true,
      period,
      transaction_count: transactions.length,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      unmatched_expenses: unmatchedExpenses || 0,
      matching: { total: unmatchedTxs?.length || 0, matched: matchedCount, unmatched: (unmatchedTxs?.length || 0) - matchedCount },
    })
  } catch (error) {
    console.error('Bank statement confirm error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
