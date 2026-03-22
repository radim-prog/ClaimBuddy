import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { autoMatchTransaction, autoMatchTransactionV2, detectPeriodicPatterns } from '@/lib/bank-matching'
import type { MatchResultV2 } from '@/lib/types/bank-matching'
import { calculateDetailedTaxImpact } from '@/lib/tax-impact'
import { upsertClosureField } from '@/lib/closure-store-db'
import { triggerMissingDocsReminder } from '@/lib/missing-docs-reminder'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id } = body

    // V2 matching via query param or body
    const url = new URL(request.url)
    const useV2 = url.searchParams.get('version') === '2' || body.version === 2

    if (!company_id) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    // Get company info
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('legal_form, vat_payer')
      .eq('id', company_id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get unmatched transactions
    const { data: transactions } = await supabaseAdmin
      .from('bank_transactions')
      .select('*')
      .eq('company_id', company_id)
      .is('matched_document_id', null)
      .is('matched_invoice_id', null)
      .limit(1000)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ matched: 0, message: 'No unmatched transactions' })
    }

    // Get documents, invoices, and unmatched dohoda vykazy for matching
    const [{ data: documents }, { data: invoices }] = await Promise.all([
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

    // Separate query for dohoda_mesice (table may not exist yet)
    const { data: dohodaVykazy } = await (supabaseAdmin as any)
      .from('dohoda_mesice')
      .select('id, cista_mzda, period, dohody(employees(first_name, last_name))')
      .eq('company_id', company_id)
      .eq('payment_status', 'unpaid')
      .eq('vykaz_status', 'confirmed')
      .limit(200)

    const matchableDocs = (documents || []).map(d => ({
      id: d.id,
      variable_symbol: d.ocr_data?.variable_symbol || null,
      total_with_vat: d.ocr_data?.total_amount || d.ocr_data?.total_with_vat || null,
      date_issued: d.ocr_data?.date_issued || null,
      supplier_name: d.supplier_name || d.ocr_data?.supplier_name || null,
      supplier_ico: d.supplier_ico || d.ocr_data?.supplier_ico || null,
    }))

    const matchableInvs = (invoices || []).map(i => ({
      id: i.id,
      variable_symbol: i.variable_symbol,
      total_with_vat: i.total_with_vat,
      issue_date: i.issue_date,
      partner: i.partner,
    }))

    const matchableDohodaVykazy = (dohodaVykazy || []).map((v: any) => ({
      id: v.id,
      cista_mzda: Number(v.cista_mzda) || 0,
      period: v.period,
      employee_name: v.dohody?.employees
        ? `${v.dohody.employees.first_name} ${v.dohody.employees.last_name}`
        : undefined,
    }))

    // V2: load periodic patterns for pattern matching
    let patterns: any[] = []
    if (useV2) {
      const { data: patternData } = await supabaseAdmin
        .from('periodic_patterns')
        .select('*')
        .eq('company_id', company_id)
        .eq('is_active', true)
        .limit(200)
      patterns = patternData || []
    }

    let matched = 0
    const matchedTxIds: string[] = []

    for (const tx of transactions) {
      const txInput = {
        id: tx.id,
        amount: tx.amount,
        variable_symbol: tx.variable_symbol,
        counterparty_name: tx.counterparty_name,
        counterparty_account: tx.counterparty_account,
        transaction_date: tx.transaction_date,
        description: tx.description,
        category: tx.category,
        is_recurring: tx.is_recurring,
        periodic_pattern_id: tx.periodic_pattern_id,
      }

      // Use V2 or V1 matching engine
      const match: MatchResultV2 | null = useV2
        ? autoMatchTransactionV2(txInput, matchableDocs, matchableInvs, {
            dohodaVykazy: matchableDohodaVykazy,
            patterns,
          })
        : autoMatchTransaction(txInput, matchableDocs, matchableInvs, matchableDohodaVykazy)

      if (match && (match.document_id || match.invoice_id || match.dohoda_mesic_id)) {
        const updateData: Record<string, any> = {
          matched_document_id: match.document_id || null,
          matched_invoice_id: match.invoice_id || null,
          matched_dohoda_mesic_id: match.dohoda_mesic_id || null,
          match_group_id: (match as MatchResultV2).match_group_id || null,
          match_confidence: match.confidence,
          match_method: match.method,
          tax_impact: 0,
          vat_impact: 0,
          updated_at: new Date().toISOString(),
        }

        // V2: apply suggested category if present
        if (useV2 && (match as MatchResultV2).suggested_category) {
          updateData.category = (match as MatchResultV2).suggested_category
        }

        await supabaseAdmin
          .from('bank_transactions')
          .update(updateData)
          .eq('id', tx.id)

        // If matched to dohoda vykaz, also update payment status
        if (match.dohoda_mesic_id) {
          await supabaseAdmin
            .from('dohoda_mesice')
            .update({
              payment_status: 'paid',
              payment_date: tx.transaction_date,
              payment_method: 'bank',
              updated_at: new Date().toISOString(),
            })
            .eq('id', match.dohoda_mesic_id)
        }

        matched++
        matchedTxIds.push(tx.id)
      } else {
        // V2: apply auto-category even for unmatched
        if (useV2 && match && (match as MatchResultV2).suggested_category) {
          await supabaseAdmin
            .from('bank_transactions')
            .update({
              category: (match as MatchResultV2).suggested_category,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tx.id)
        }

        if (tx.amount < 0) {
          // Recalculate detailed tax impact for still-unmatched expenses
          const impact = calculateDetailedTaxImpact(tx.amount, company.legal_form, company.vat_payer)
          await supabaseAdmin
            .from('bank_transactions')
            .update({
              tax_impact: impact.income_tax,
              vat_impact: impact.vat,
              social_impact: impact.social_insurance,
              health_impact: impact.health_insurance,
              total_impact: impact.total,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tx.id)
        }
      }
    }

    // V2: detect and save periodic patterns after matching
    if (useV2 && transactions.length >= 3) {
      const allTxInputs = transactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        variable_symbol: tx.variable_symbol,
        counterparty_name: tx.counterparty_name,
        counterparty_account: tx.counterparty_account,
        transaction_date: tx.transaction_date,
        description: tx.description,
      }))

      const newPatterns = detectPeriodicPatterns(allTxInputs, company_id)
      for (const pattern of newPatterns) {
        // Upsert: skip if pattern with same counterparty already exists
        let query = supabaseAdmin
          .from('periodic_patterns')
          .select('id')
          .eq('company_id', company_id)
          .eq('is_active', true)

        if (pattern.counterparty_account) {
          query = query.eq('counterparty_account', pattern.counterparty_account)
        } else {
          query = query.is('counterparty_account', null)
        }

        const { data: existing } = await query.limit(1)

        if (!existing || existing.length === 0) {
          await supabaseAdmin.from('periodic_patterns').insert(pattern)
        }
      }
    }

    // Auto-advance closure for periods where all expenses are matched
    if (matched > 0) {
      const periods = [...new Set(transactions.map(t => t.period).filter(Boolean))]
      for (const period of periods) {
        // Check unmatched expenses (excluding private/deposit)
        const { count: unmatchedExpenses } = await supabaseAdmin
          .from('bank_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .eq('period', period)
          .lt('amount', 0)
          .is('matched_document_id', null)
          .is('matched_dohoda_mesic_id', null)
          .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')

        if ((unmatchedExpenses || 0) === 0) {
          await upsertClosureField(company_id, period!, 'expense_documents_status', 'approved', userId!)
        }

        // Check unmatched income
        const { count: unmatchedIncome } = await supabaseAdmin
          .from('bank_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .eq('period', period)
          .gt('amount', 0)
          .is('matched_invoice_id', null)
          .not('category', 'in', '("other_taxable","private_transfer","owner_deposit","internal_transfer")')

        if ((unmatchedIncome || 0) === 0) {
          await upsertClosureField(company_id, period!, 'income_invoices_status', 'approved', userId!)
        }
      }
    }

    // Trigger missing docs reminders for affected periods
    const affectedPeriods = [...new Set(transactions.map(t => t.period).filter(Boolean))]
    for (const period of affectedPeriods) {
      triggerMissingDocsReminder(company_id, period!, userId!).catch(err => {
        console.error('[AutoMatch] Reminder trigger error:', err)
      })
    }

    return NextResponse.json({
      success: true,
      total: transactions.length,
      matched,
      unmatched: transactions.length - matched,
      engine: useV2 ? 'v2' : 'v1',
    })
  } catch (error) {
    console.error('[AutoMatch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
