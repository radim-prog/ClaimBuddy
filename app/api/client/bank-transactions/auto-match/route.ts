import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { autoMatchTransaction, calculateTaxImpact } from '@/lib/bank-matching'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id } = body

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

    let matched = 0

    for (const tx of transactions) {
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
        matchableInvs,
        matchableDohodaVykazy
      )

      if (match) {
        await supabaseAdmin
          .from('bank_transactions')
          .update({
            matched_document_id: match.document_id || null,
            matched_invoice_id: match.invoice_id || null,
            matched_dohoda_mesic_id: match.dohoda_mesic_id || null,
            match_confidence: match.confidence,
            match_method: match.method,
            tax_impact: 0,
            vat_impact: 0,
            updated_at: new Date().toISOString(),
          })
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
      } else if (tx.amount < 0) {
        // Recalculate tax impact for still-unmatched expenses
        const impact = calculateTaxImpact(tx.amount, company.legal_form, company.vat_payer)
        await supabaseAdmin
          .from('bank_transactions')
          .update({
            tax_impact: impact.tax,
            vat_impact: impact.vat,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tx.id)
      }
    }

    return NextResponse.json({
      success: true,
      total: transactions.length,
      matched,
      unmatched: transactions.length - matched,
    })
  } catch (error) {
    console.error('[AutoMatch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
