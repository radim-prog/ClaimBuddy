import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { upsertClosureField } from '@/lib/closure-store-db'

export const dynamic = 'force-dynamic'

// POST /api/client/bank-statements/confirm
// Confirm a bank statement: categorize transactions, update tax_period_data, advance closure
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, period, categories } = body as {
      company_id: string
      period: string // 'YYYY-MM'
      categories?: Record<string, string> // transaction_id → category
    }

    if (!company_id || !period) {
      return NextResponse.json({ error: 'company_id and period required' }, { status: 400 })
    }

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

    // 5. Check if all expenses are matched → advance expense_documents_status
    const unmatchedExpenses = transactions.filter(
      tx => tx.amount < 0
        && !tx.matched_document_id
        && !NON_TAXABLE_CATEGORIES.includes(tx.category || '')
    ).length

    if (unmatchedExpenses === 0) {
      await upsertClosureField(company_id, period, 'expense_documents_status', 'approved', userId)
    }

    return NextResponse.json({
      success: true,
      period,
      transaction_count: transactions.length,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      unmatched_expenses: unmatchedExpenses,
    })
  } catch (error) {
    console.error('Bank statement confirm error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
