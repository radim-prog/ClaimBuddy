import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import {
  generateBankDocumentXml,
  generateBankLiquidationXml,
  generateVoucherXml,
  type BankDocumentForExport,
  type BankDocumentInvoiceLink,
  type CashVoucherForExport,
} from '@/lib/pohoda-xml'

export const dynamic = 'force-dynamic'

// GET /api/accountant/closures/export-pohoda?company_id=X&period=2026-01&type=bank|cash|all
// Returns Pohoda XML export for bank documents and/or cash vouchers
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')
    const exportType = searchParams.get('type') || 'all' // bank, cash, all

    if (!companyId || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    // Get company ICO + bank account
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('ico, bank_account, bank_code')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const ico = company.ico || ''
    const bankAccount = company.bank_account && company.bank_code
      ? { accountNo: company.bank_account, bankCode: company.bank_code }
      : null

    const xmlParts: string[] = []

    // Bank documents export
    if (exportType === 'bank' || exportType === 'all') {
      // Fetch matched bank transactions
      const { data: bankTxs } = await supabaseAdmin
        .from('bank_transactions')
        .select('id, transaction_date, amount, variable_symbol, constant_symbol, specific_symbol, counterparty_name, counterparty_account, counterparty_bank_code, description, period, matched_invoice_id')
        .eq('company_id', companyId)
        .eq('period', period)
        .not('match_method', 'is', null)

      const transactions = bankTxs || []

      // Separate: plain bank docs vs invoice liquidations
      const plainBankDocs: BankDocumentForExport[] = []
      const liquidationPairs: Array<{ transaction: BankDocumentForExport; invoice: BankDocumentInvoiceLink }> = []

      for (const tx of transactions) {
        const bankDoc: BankDocumentForExport = {
          id: tx.id,
          transaction_date: tx.transaction_date,
          amount: tx.amount,
          variable_symbol: tx.variable_symbol,
          constant_symbol: tx.constant_symbol,
          specific_symbol: tx.specific_symbol,
          counterparty_name: tx.counterparty_name,
          counterparty_account: tx.counterparty_account,
          counterparty_bank_code: tx.counterparty_bank_code,
          description: tx.description,
          period: tx.period,
        }

        if (tx.matched_invoice_id) {
          // Get invoice number for liquidation
          const { data: invoice } = await supabaseAdmin
            .from('invoices')
            .select('invoice_number')
            .eq('id', tx.matched_invoice_id)
            .single()

          if (invoice) {
            liquidationPairs.push({
              transaction: bankDoc,
              invoice: {
                invoice_number: invoice.invoice_number || tx.variable_symbol || tx.id,
                amount: Math.abs(tx.amount),
              },
            })
          } else {
            plainBankDocs.push(bankDoc)
          }
        } else {
          plainBankDocs.push(bankDoc)
        }
      }

      if (plainBankDocs.length > 0) {
        xmlParts.push(generateBankDocumentXml(plainBankDocs, ico, bankAccount))
      }
      if (liquidationPairs.length > 0) {
        xmlParts.push(generateBankLiquidationXml(liquidationPairs, ico, bankAccount))
      }
    }

    // Cash vouchers export
    if (exportType === 'cash' || exportType === 'all') {
      const { data: cashTxs } = await supabaseAdmin
        .from('cash_transactions')
        .select('id, doc_type, doc_number, transaction_date, amount, description, counterparty_name, counterparty_ico, vat_rate')
        .eq('company_id', companyId)
        .eq('period', period)
        .order('doc_number')

      const vouchers: CashVoucherForExport[] = (cashTxs || []).map(tx => ({
        id: tx.id,
        doc_type: tx.doc_type as 'PPD' | 'VPD',
        doc_number: tx.doc_number,
        transaction_date: tx.transaction_date,
        amount: Math.abs(tx.amount),
        description: tx.description,
        counterparty_name: tx.counterparty_name,
        counterparty_ico: tx.counterparty_ico,
        vat_rate: tx.vat_rate,
      }))

      if (vouchers.length > 0) {
        xmlParts.push(generateVoucherXml(vouchers, ico))
      }
    }

    if (xmlParts.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 })
    }

    // If single XML, return directly; if multiple, return as array
    if (xmlParts.length === 1) {
      return new NextResponse(xmlParts[0], {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="pohoda-${companyId}-${period}.xml"`,
        },
      })
    }

    // Multiple XMLs — return as JSON with xml strings
    return NextResponse.json({
      company_id: companyId,
      period,
      exports: xmlParts.map((xml, i) => ({
        index: i,
        type: i === 0 ? 'bank' : i === 1 ? 'liquidation' : 'cash',
        xml,
      })),
    })
  } catch (error) {
    console.error('[ClosureExportPohoda] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
