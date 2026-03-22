import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractBankStatement } from '@/lib/kimi-ai'
import { autoMatchTransaction, calculateTaxImpact } from '@/lib/bank-matching'
import { parseBankStatement } from '@/lib/bank-statement-parser'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null

    if (!file || !companyId) {
      return NextResponse.json({ error: 'Missing file or companyId' }, { status: 400 })
    }

    const ALLOWED_MIME_TYPES = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/csv', 'text/plain', // CSV + MT940 (.sta)
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'application/octet-stream', // generic binary (MT940)
    ]
    // Allow known extensions even if MIME is wrong
    const ext = file.name.toLowerCase().split('.').pop() || ''
    const allowedExts = ['csv', 'sta', 'mt940', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'xlsx', 'xls']
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Nepodporovaný typ souboru' }, { status: 400 })
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

    const buffer = Buffer.from(await file.arrayBuffer())

    // Try structured parser first (CSV, MT940), fall back to OCR for PDF/images
    let result: {
      account_number?: string | null
      period_from?: string | null
      period_to?: string | null
      transactions: Array<{
        date: string; amount: number; currency: string
        variable_symbol?: string | null; constant_symbol?: string | null
        counterparty_account?: string | null; counterparty_name?: string | null
        description?: string | null
      }>
    }

    const parsed = await parseBankStatement(buffer, file.name, file.type)
    if (parsed && parsed.transactions.length > 0) {
      // Structured parse succeeded
      result = parsed
    } else {
      // OCR fallback for PDF/images/unknown formats
      result = await extractBankStatement(buffer, file.name, file.type)
    }

    const period = result.period_from?.substring(0, 7) || new Date().toISOString().substring(0, 7)

    // Upload file to Supabase Storage
    const storagePath = `bank-statements/${companyId}/${period}/${Date.now()}-${file.name}`
    await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    // Save document reference
    const { data: docRecord } = await supabaseAdmin
      .from('documents')
      .insert({
        company_id: companyId,
        file_name: file.name,
        type: 'bank_statement',
        status: 'uploaded',
        period,
        uploaded_by: userId,
        storage_path: storagePath,
        file_size_bytes: buffer.length,
      })
      .select('id')
      .single()

    // Fetch existing documents and invoices for matching
    const [{ data: documents }, { data: invoices }] = await Promise.all([
      supabaseAdmin
        .from('documents')
        .select('id, ocr_data, supplier_name, supplier_ico')
        .eq('company_id', companyId)
        .neq('type', 'bank_statement')
        .is('deleted_at', null)
        .limit(500),
      supabaseAdmin
        .from('invoices')
        .select('id, variable_symbol, total_with_vat, issue_date, partner')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .limit(500),
    ])

    // Map documents to matchable format
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

    // Insert transactions with auto-matching
    const transactions = result.transactions.map(tx => {
      const match = autoMatchTransaction(
        {
          id: '',
          amount: tx.amount,
          variable_symbol: tx.variable_symbol,
          counterparty_name: tx.counterparty_name,
          counterparty_account: tx.counterparty_account,
          transaction_date: tx.date,
          description: tx.description,
        },
        matchableDocs,
        matchableInvs
      )

      const taxImpact = !match && tx.amount < 0
        ? calculateTaxImpact(tx.amount, company.legal_form, company.vat_payer)
        : { tax: 0, vat: 0 }

      return {
        company_id: companyId,
        bank_statement_document_id: docRecord?.id || null,
        transaction_date: tx.date,
        amount: tx.amount,
        currency: tx.currency,
        variable_symbol: tx.variable_symbol,
        constant_symbol: tx.constant_symbol,
        counterparty_account: tx.counterparty_account,
        counterparty_name: tx.counterparty_name,
        description: tx.description,
        matched_document_id: match?.document_id || null,
        matched_invoice_id: match?.invoice_id || null,
        match_confidence: match?.confidence || null,
        match_method: match?.method || null,
        tax_impact: taxImpact.tax,
        vat_impact: taxImpact.vat,
        period: tx.date?.substring(0, 7) || null,
      }
    })

    let inserted = 0
    if (transactions.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('bank_transactions')
        .insert(transactions)
        .select('id')

      if (error) {
        console.error('[BankStatement] Insert error:', error)
        return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 })
      }
      inserted = data?.length || 0
    }

    const matched = transactions.filter(t => t.matched_document_id || t.matched_invoice_id).length
    const totalTaxImpact = transactions.reduce((s, t) => s + (t.tax_impact || 0), 0)
    const totalVatImpact = transactions.reduce((s, t) => s + (t.vat_impact || 0), 0)

    return NextResponse.json({
      success: true,
      statement: {
        account_number: result.account_number,
        period_from: result.period_from,
        period_to: result.period_to,
        transaction_count: result.transactions.length,
      },
      inserted,
      matched,
      unmatched: inserted - matched,
      tax_impact: totalTaxImpact,
      vat_impact: totalVatImpact,
    })
  } catch (error) {
    console.error('[BankStatement] Extract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process bank statement' },
      { status: 500 }
    )
  }
}
