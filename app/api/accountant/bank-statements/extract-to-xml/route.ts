import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { parseBankStatement } from '@/lib/bank-statement-parser'
import { extractBankStatement } from '@/lib/kimi-ai'
import { generateBankDocumentXml, type BankDocumentForExport } from '@/lib/pohoda-xml'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null
    const mode = (formData.get('mode') as string) || 'extract_only'

    if (!file || !companyId) {
      return NextResponse.json({ error: 'Missing file or companyId' }, { status: 400 })
    }

    // Validate file type
    const ext = file.name.toLowerCase().split('.').pop() || ''
    const allowedExts = ['csv', 'sta', 'mt940', 'pdf', 'jpg', 'jpeg', 'png']
    const allowedMimes = [
      'application/pdf', 'text/csv', 'text/plain',
      'image/jpeg', 'image/png', 'application/octet-stream',
    ]
    if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Get company info (ICO + bank account)
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('ico, bank_account, bank_code, name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Step 1: Parse — try structured parser, fallback to OCR
    let rawTransactions: Array<{
      date: string; amount: number; currency: string
      variable_symbol?: string | null; constant_symbol?: string | null
      specific_symbol?: string | null
      counterparty_account?: string | null; counterparty_name?: string | null
      counterparty_bank_code?: string | null
      description?: string | null
    }>

    const parsed = await parseBankStatement(buffer, file.name, file.type)
    if (parsed && parsed.transactions.length > 0) {
      rawTransactions = parsed.transactions
    } else {
      const ocrResult = await extractBankStatement(buffer, file.name, file.type)
      rawTransactions = ocrResult.transactions.map(tx => ({
        date: tx.date,
        amount: tx.amount,
        currency: tx.currency || 'CZK',
        variable_symbol: tx.variable_symbol,
        constant_symbol: tx.constant_symbol,
        counterparty_account: tx.counterparty_account,
        counterparty_name: tx.counterparty_name,
        description: tx.description,
      }))
    }

    // Step 2: Convert to BankDocumentForExport[]
    const transactions: BankDocumentForExport[] = rawTransactions.map((tx, i) => ({
      id: `tx_${Date.now()}_${i}`,
      transaction_date: tx.date,
      amount: tx.amount,
      variable_symbol: tx.variable_symbol,
      constant_symbol: tx.constant_symbol,
      specific_symbol: tx.specific_symbol,
      counterparty_name: tx.counterparty_name,
      counterparty_account: tx.counterparty_account,
      counterparty_bank_code: tx.counterparty_bank_code,
      description: tx.description,
    }))

    // Step 3: Generate Pohoda XML
    const ico = company.ico || ''
    const bankAccount = company.bank_account && company.bank_code
      ? { accountNo: company.bank_account, bankCode: company.bank_code }
      : null

    const xml = generateBankDocumentXml(transactions, ico, bankAccount)

    // Step 4: Optionally save to storage
    let documentId: string | undefined
    if (mode === 'extract_and_save') {
      const period = rawTransactions[0]?.date?.substring(0, 7) || new Date().toISOString().substring(0, 7)
      const storagePath = `bank-statements/${companyId}/${period}/${Date.now()}-${file.name}`

      await supabaseAdmin.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: file.type, upsert: false })

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

      documentId = docRecord?.id
    }

    // Step 5: Compute stats
    const receipts = transactions.filter(t => t.amount > 0)
    const expenses = transactions.filter(t => t.amount <= 0)

    return NextResponse.json({
      transactions: transactions.map(t => ({
        date: t.transaction_date,
        amount: t.amount,
        variable_symbol: t.variable_symbol,
        constant_symbol: t.constant_symbol,
        counterparty_name: t.counterparty_name,
        counterparty_account: t.counterparty_account,
        counterparty_bank_code: t.counterparty_bank_code,
        description: t.description,
      })),
      xml,
      document_id: documentId,
      stats: {
        total: transactions.length,
        receipts: receipts.length,
        expenses: expenses.length,
        total_receipts: receipts.reduce((s, t) => s + t.amount, 0),
        total_expenses: expenses.reduce((s, t) => s + t.amount, 0),
      },
    })
  } catch (error) {
    console.error('[ExtractToXml] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process bank statement' },
      { status: 500 }
    )
  }
}
