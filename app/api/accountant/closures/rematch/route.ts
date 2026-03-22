import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { autoMatchTransactionV2, detectPeriodicPatterns } from '@/lib/bank-matching'
import type { MatchResultV2 } from '@/lib/types/bank-matching'
import { calculateDetailedTaxImpact } from '@/lib/tax-impact'

export const dynamic = 'force-dynamic'

// POST /api/accountant/closures/rematch
// Body: { company_id, period? }
// Resets all auto-matches and re-runs V2 matching engine
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, period } = body

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

    // Reset non-manual matches
    let resetQuery = supabaseAdmin
      .from('bank_transactions')
      .update({
        matched_document_id: null,
        matched_invoice_id: null,
        matched_dohoda_mesic_id: null,
        match_group_id: null,
        match_confidence: null,
        match_method: null,
        tax_impact: 0,
        vat_impact: 0,
        social_impact: 0,
        health_impact: 0,
        total_impact: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', company_id)
      .neq('match_method', 'manual')

    if (period) {
      resetQuery = resetQuery.eq('period', period)
    }

    await resetQuery

    // Now fetch all unmatched transactions
    let txQuery = supabaseAdmin
      .from('bank_transactions')
      .select('*')
      .eq('company_id', company_id)
      .is('matched_document_id', null)
      .is('matched_invoice_id', null)
      .limit(2000)

    if (period) {
      txQuery = txQuery.eq('period', period)
    }

    const { data: transactions } = await txQuery

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ success: true, reset: 0, matched: 0, message: 'No transactions to rematch' })
    }

    // Load matching data
    const [{ data: documents }, { data: invoices }, { data: patterns }, { data: dohodaVykazy }] = await Promise.all([
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
      supabaseAdmin
        .from('periodic_patterns')
        .select('*')
        .eq('company_id', company_id)
        .eq('is_active', true)
        .limit(200),
      (supabaseAdmin as any)
        .from('dohoda_mesice')
        .select('id, cista_mzda, period, dohody(employees(first_name, last_name))')
        .eq('company_id', company_id)
        .eq('payment_status', 'unpaid')
        .eq('vykaz_status', 'confirmed')
        .limit(200),
    ])

    const matchableDocs = (documents || []).map((d: any) => ({
      id: d.id,
      variable_symbol: d.ocr_data?.variable_symbol || null,
      total_with_vat: d.ocr_data?.total_amount || d.ocr_data?.total_with_vat || null,
      date_issued: d.ocr_data?.date_issued || null,
      supplier_name: d.supplier_name || d.ocr_data?.supplier_name || null,
      supplier_ico: d.supplier_ico || d.ocr_data?.supplier_ico || null,
    }))

    const matchableInvs = (invoices || []).map((i: any) => ({
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

    // Run V2 matching
    let matched = 0
    const now = new Date().toISOString()

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

      const match: MatchResultV2 | null = autoMatchTransactionV2(
        txInput, matchableDocs, matchableInvs,
        { dohodaVykazy: matchableDohodaVykazy, patterns: patterns || [] }
      )

      if (match && (match.document_id || match.invoice_id || match.dohoda_mesic_id)) {
        const updateData: Record<string, any> = {
          matched_document_id: match.document_id || null,
          matched_invoice_id: match.invoice_id || null,
          matched_dohoda_mesic_id: match.dohoda_mesic_id || null,
          match_group_id: match.match_group_id || null,
          match_confidence: match.confidence,
          match_method: match.method,
          tax_impact: 0,
          vat_impact: 0,
          social_impact: 0,
          health_impact: 0,
          total_impact: 0,
          updated_at: now,
        }

        if (match.suggested_category) {
          updateData.category = match.suggested_category
        }

        await supabaseAdmin
          .from('bank_transactions')
          .update(updateData)
          .eq('id', tx.id)

        matched++
      } else {
        // Apply category + tax impact for unmatched expenses
        const updateData: Record<string, any> = { updated_at: now }

        if (match?.suggested_category) {
          updateData.category = match.suggested_category
        }

        if (tx.amount < 0) {
          const impact = calculateDetailedTaxImpact(tx.amount, company.legal_form, company.vat_payer)
          updateData.tax_impact = impact.income_tax
          updateData.vat_impact = impact.vat
          updateData.social_impact = impact.social_insurance
          updateData.health_impact = impact.health_insurance
          updateData.total_impact = impact.total
        }

        await supabaseAdmin
          .from('bank_transactions')
          .update(updateData)
          .eq('id', tx.id)
      }
    }

    // Detect new periodic patterns
    if (transactions.length >= 3) {
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

    return NextResponse.json({
      success: true,
      company_id,
      period: period || 'all',
      reset: transactions.length,
      total: transactions.length,
      matched,
      unmatched: transactions.length - matched,
      engine: 'v2',
    })
  } catch (error) {
    console.error('[ClosureRematch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
