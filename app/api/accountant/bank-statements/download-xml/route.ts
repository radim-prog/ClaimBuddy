import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { generateBankDocumentXml, type BankDocumentForExport } from '@/lib/pohoda-xml'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period')
    const documentId = searchParams.get('documentId')

    if (!companyId || !period) {
      return NextResponse.json({ error: 'Missing companyId or period' }, { status: 400 })
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

    // Build query for bank transactions
    let query = supabaseAdmin
      .from('bank_transactions')
      .select('id, transaction_date, amount, variable_symbol, constant_symbol, specific_symbol, counterparty_name, counterparty_account, counterparty_bank_code, description, period')
      .eq('company_id', companyId)
      .eq('period', period)

    if (documentId) {
      query = query.eq('bank_statement_document_id', documentId)
    }

    const { data: bankTxs, error } = await query

    if (error) {
      console.error('[DownloadXml] Query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!bankTxs || bankTxs.length === 0) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 })
    }

    // Convert to BankDocumentForExport[]
    const transactions: BankDocumentForExport[] = bankTxs.map(tx => ({
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
    }))

    const ico = company.ico || ''
    const bankAccount = company.bank_account && company.bank_code
      ? { accountNo: company.bank_account, bankCode: company.bank_code }
      : null

    const xml = generateBankDocumentXml(transactions, ico, bankAccount)
    const filename = `bv-${ico || companyId}-${period}.xml`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[DownloadXml] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
