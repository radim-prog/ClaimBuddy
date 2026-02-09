import { NextRequest, NextResponse } from 'next/server'
// TODO: Uncomment when lib modules are created
// import { parseBankStatement } from '@/lib/bank-statement-parser'
// import { matchTransactions } from '@/lib/matching-engine'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// TODO: Replace with import { supabaseAdmin } from '@/lib/supabase-admin'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface ParsedTransaction {
  date: string
  amount: number
  currency: string
  counterparty_account: string
  counterparty_name: string
  variable_symbol: string
  constant_symbol: string
  specific_symbol: string
  description: string
  reference: string
}

interface MatchResult {
  bank_transaction: ParsedTransaction
  matched_invoice_id: string | null
  match_confidence: number // 0.0 - 1.0
  match_method: 'variable_symbol' | 'amount_date' | 'description' | 'manual' | 'none'
}

interface BankStatementUploadResponse {
  statement_id: string
  file_name: string
  format_detected: 'csv' | 'xml' | 'unknown'
  bank_detected: string | null
  period: { from: string; to: string } | null
  parsing: {
    total_rows: number
    successfully_parsed: number
    skipped: number
    errors: string[]
  }
  matching: {
    total_transactions: number
    auto_matched: number
    suggested_matches: number
    unmatched: number
  }
  transactions: MatchResult[]
}

// Maximum file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Supported MIME types
const SUPPORTED_TYPES = [
  'text/csv',
  'text/xml',
  'application/xml',
  'application/vnd.ms-excel',   // some CSV files come as this
  'application/octet-stream',   // fallback for unknown
]

// --------------------------------------------------------------------------
// POST /api/reports/[companyId]/bank-statements
// Upload and parse a bank statement file (CSV or XML).
// --------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

    // ----- Validate companyId -----
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
      return NextResponse.json(
        { error: 'Invalid companyId format. Expected UUID.' },
        { status: 400 }
      )
    }

    // ----- Verify company exists -----
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: `Company not found: ${companyId}` },
        { status: 404 }
      )
    }

    // ----- Parse multipart form data -----
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data with a "file" field' },
        { status: 400 }
      )
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing required field "file". Upload a CSV or XML bank statement.' },
        { status: 400 }
      )
    }

    // ----- Validate file -----
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Uploaded file is empty' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      )
    }

    // ----- Detect format -----
    const fileName = file.name.toLowerCase()
    const mimeType = file.type

    let format: 'csv' | 'xml' | 'unknown' = 'unknown'
    if (fileName.endsWith('.csv') || mimeType === 'text/csv') {
      format = 'csv'
    } else if (
      fileName.endsWith('.xml') ||
      mimeType === 'text/xml' ||
      mimeType === 'application/xml'
    ) {
      format = 'xml'
    }

    if (format === 'unknown') {
      return NextResponse.json(
        {
          error: 'Unsupported file format. Please upload a CSV or XML bank statement.',
          received_mime: mimeType,
          received_name: file.name,
        },
        { status: 415 }
      )
    }

    // ----- Read file content -----
    const fileContent = await file.text()

    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: 'File content is empty after reading' },
        { status: 400 }
      )
    }

    // ----- Parse bank statement -----
    // TODO: Replace with const parsed = await parseBankStatement(fileContent, format)
    let parsedTransactions: ParsedTransaction[]
    let bankDetected: string | null = null
    const parsingErrors: string[] = []
    let skippedRows = 0
    let totalRows = 0

    if (format === 'csv') {
      const result = parseCSVBankStatement(fileContent)
      parsedTransactions = result.transactions
      bankDetected = result.bankDetected
      parsingErrors.push(...result.errors)
      skippedRows = result.skipped
      totalRows = result.totalRows
    } else {
      const result = parseXMLBankStatement(fileContent)
      parsedTransactions = result.transactions
      bankDetected = result.bankDetected
      parsingErrors.push(...result.errors)
      skippedRows = result.skipped
      totalRows = result.totalRows
    }

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        {
          error: 'No transactions could be parsed from the uploaded file.',
          parsing_errors: parsingErrors,
        },
        { status: 422 }
      )
    }

    // ----- Determine period from parsed transactions -----
    const dates = parsedTransactions.map((t) => t.date).sort()
    const periodRange = dates.length > 0
      ? { from: dates[0], to: dates[dates.length - 1] }
      : null

    // ----- Store the raw bank statement record -----
    const { data: statementRecord, error: stmtError } = await supabaseAdmin
      .from('bank_statements')
      .insert({
        company_id: companyId,
        file_name: file.name,
        format: format,
        bank_detected: bankDetected,
        uploaded_at: new Date().toISOString(),
        period_from: periodRange?.from ?? null,
        period_to: periodRange?.to ?? null,
        raw_transaction_count: parsedTransactions.length,
        status: 'processing',
      })
      .select()
      .single()

    if (stmtError) {
      console.error('[POST /bank-statements] DB error creating statement record:', stmtError)
      return NextResponse.json(
        { error: 'Failed to create bank statement record in database' },
        { status: 500 }
      )
    }

    // ----- Store the file in Supabase Storage -----
    const storagePath = `bank-statements/${companyId}/${statementRecord.id}/${file.name}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, fileContent, {
        contentType: mimeType || 'text/plain',
        upsert: false,
      })

    if (uploadError) {
      console.warn('[POST /bank-statements] Storage upload failed (non-critical):', uploadError)
      // Non-critical -- continue processing. The raw data is still in the DB.
    }

    // ----- Match transactions against existing invoices / ledger entries -----
    // TODO: Replace with const matches = await matchTransactions(companyId, parsedTransactions)
    const matchResults = await matchTransactionsInline(companyId, parsedTransactions)

    // ----- Persist parsed transactions to DB -----
    const transactionRows = parsedTransactions.map((tx, index) => ({
      bank_statement_id: statementRecord.id,
      company_id: companyId,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      counterparty_account: tx.counterparty_account || null,
      counterparty_name: tx.counterparty_name || null,
      variable_symbol: tx.variable_symbol || null,
      constant_symbol: tx.constant_symbol || null,
      specific_symbol: tx.specific_symbol || null,
      description: tx.description || null,
      reference: tx.reference || null,
      matched_invoice_id: matchResults[index]?.matched_invoice_id ?? null,
      match_confidence: matchResults[index]?.match_confidence ?? 0,
      match_method: matchResults[index]?.match_method ?? 'none',
    }))

    const { error: txInsertError } = await supabaseAdmin
      .from('bank_transactions')
      .insert(transactionRows)

    if (txInsertError) {
      console.error('[POST /bank-statements] DB error inserting transactions:', txInsertError)

      // Mark statement as failed
      await supabaseAdmin
        .from('bank_statements')
        .update({ status: 'error' })
        .eq('id', statementRecord.id)

      return NextResponse.json(
        { error: 'Failed to save parsed transactions to database' },
        { status: 500 }
      )
    }

    // ----- Update statement status -----
    const autoMatched = matchResults.filter((m) => m.match_confidence >= 0.9).length
    const suggested = matchResults.filter(
      (m) => m.match_confidence >= 0.5 && m.match_confidence < 0.9
    ).length
    const unmatched = matchResults.filter((m) => m.match_confidence < 0.5).length

    await supabaseAdmin
      .from('bank_statements')
      .update({
        status: 'completed',
        auto_matched_count: autoMatched,
        suggested_match_count: suggested,
        unmatched_count: unmatched,
      })
      .eq('id', statementRecord.id)

    // ----- Build response -----
    const response: BankStatementUploadResponse = {
      statement_id: statementRecord.id,
      file_name: file.name,
      format_detected: format,
      bank_detected: bankDetected,
      period: periodRange,
      parsing: {
        total_rows: totalRows,
        successfully_parsed: parsedTransactions.length,
        skipped: skippedRows,
        errors: parsingErrors,
      },
      matching: {
        total_transactions: parsedTransactions.length,
        auto_matched: autoMatched,
        suggested_matches: suggested,
        unmatched: unmatched,
      },
      transactions: matchResults,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[POST /bank-statements] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// --------------------------------------------------------------------------
// Inline CSV parser
// TODO: Move into @/lib/bank-statement-parser
//
// Supports common Czech bank export formats:
//   - Fio Banka CSV
//   - CSOB CSV
//   - Komercni Banka CSV
//   - Generic CSV with headers
// --------------------------------------------------------------------------

function parseCSVBankStatement(content: string): {
  transactions: ParsedTransaction[]
  bankDetected: string | null
  errors: string[]
  skipped: number
  totalRows: number
} {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')
  const transactions: ParsedTransaction[] = []
  const errors: string[] = []
  let bankDetected: string | null = null
  let skipped = 0

  if (lines.length < 2) {
    return { transactions: [], bankDetected: null, errors: ['File has fewer than 2 lines'], skipped: 0, totalRows: 0 }
  }

  // ----- Detect bank from header patterns -----
  const headerLine = lines[0].toLowerCase()
  if (headerLine.includes('id operace') || headerLine.includes('id pohybu')) {
    bankDetected = 'Fio Banka'
  } else if (headerLine.includes('datum zaúčtování') && headerLine.includes('číslo účtu protistrany')) {
    bankDetected = 'CSOB'
  } else if (headerLine.includes('datum splatnosti')) {
    bankDetected = 'Komercni Banka'
  }

  // ----- Parse header to find column indices -----
  const separator = detectSeparator(lines[0])
  const headers = parseCSVLine(lines[0], separator).map((h) => h.toLowerCase().trim())

  // Map known column names to our fields
  const columnMap = {
    date: findColumnIndex(headers, ['datum', 'date', 'datum zaúčtování', 'datum provedení']),
    amount: findColumnIndex(headers, ['castka', 'částka', 'amount', 'objem', 'suma']),
    currency: findColumnIndex(headers, ['měna', 'mena', 'currency']),
    counterpartyAccount: findColumnIndex(headers, ['protiúčet', 'protiucet', 'číslo účtu protistrany', 'counterparty account', 'účet']),
    counterpartyName: findColumnIndex(headers, ['název protistrany', 'nazev protistrany', 'jméno protistrany', 'counterparty name', 'název']),
    variableSymbol: findColumnIndex(headers, ['vs', 'variabilní symbol', 'variabilni symbol', 'variable symbol']),
    constantSymbol: findColumnIndex(headers, ['ks', 'konstantní symbol', 'konstantni symbol', 'constant symbol']),
    specificSymbol: findColumnIndex(headers, ['ss', 'specifický symbol', 'specificky symbol', 'specific symbol']),
    description: findColumnIndex(headers, ['poznámka', 'poznamka', 'popis', 'description', 'zpráva pro příjemce', 'zprava pro prijemce']),
    reference: findColumnIndex(headers, ['reference', 'id operace', 'id pohybu', 'ref']),
  }

  // Must have at least date and amount
  if (columnMap.date === -1 || columnMap.amount === -1) {
    errors.push('Could not identify required columns: date, amount. Check CSV format.')
    return { transactions: [], bankDetected, errors, skipped: 0, totalRows: lines.length - 1 }
  }

  // ----- Parse data rows -----
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], separator)

    if (fields.length < 2) {
      skipped++
      continue
    }

    try {
      const rawDate = safeGet(fields, columnMap.date)
      const rawAmount = safeGet(fields, columnMap.amount)

      if (!rawDate || !rawAmount) {
        skipped++
        continue
      }

      const date = normalizeDate(rawDate)
      const amount = normalizeAmount(rawAmount)

      if (!date || isNaN(amount)) {
        errors.push(`Row ${i + 1}: Could not parse date="${rawDate}" or amount="${rawAmount}"`)
        skipped++
        continue
      }

      transactions.push({
        date,
        amount,
        currency: safeGet(fields, columnMap.currency) || 'CZK',
        counterparty_account: safeGet(fields, columnMap.counterpartyAccount) || '',
        counterparty_name: safeGet(fields, columnMap.counterpartyName) || '',
        variable_symbol: safeGet(fields, columnMap.variableSymbol) || '',
        constant_symbol: safeGet(fields, columnMap.constantSymbol) || '',
        specific_symbol: safeGet(fields, columnMap.specificSymbol) || '',
        description: safeGet(fields, columnMap.description) || '',
        reference: safeGet(fields, columnMap.reference) || '',
      })
    } catch (e) {
      errors.push(`Row ${i + 1}: Parsing error - ${e instanceof Error ? e.message : String(e)}`)
      skipped++
    }
  }

  return {
    transactions,
    bankDetected,
    errors,
    skipped,
    totalRows: lines.length - 1,
  }
}

// --------------------------------------------------------------------------
// Inline XML parser (basic)
// TODO: Move into @/lib/bank-statement-parser
//
// Supports:
//   - Czech banking XML standard (ABO format concepts)
//   - Generic XML with <transaction> or <entry> elements
// --------------------------------------------------------------------------

function parseXMLBankStatement(content: string): {
  transactions: ParsedTransaction[]
  bankDetected: string | null
  errors: string[]
  skipped: number
  totalRows: number
} {
  const transactions: ParsedTransaction[] = []
  const errors: string[] = []
  let bankDetected: string | null = null
  let skipped = 0

  // Detect bank from XML namespace or root element
  if (content.includes('xmlns:fio') || content.includes('<FioResponse')) {
    bankDetected = 'Fio Banka'
  } else if (content.includes('CSOB') || content.includes('csob')) {
    bankDetected = 'CSOB'
  }

  // Simple regex-based XML extraction
  // NOTE: A production implementation should use a proper XML parser library.
  // This handles the most common patterns from Czech bank exports.

  // Try to find transaction-like elements
  const transactionPatterns = [
    /<Transaction>([\s\S]*?)<\/Transaction>/gi,
    /<Entry>([\s\S]*?)<\/Entry>/gi,
    /<Pohyb>([\s\S]*?)<\/Pohyb>/gi,
    /<Row>([\s\S]*?)<\/Row>/gi,
  ]

  let rawEntries: string[] = []
  for (const pattern of transactionPatterns) {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      rawEntries = matches
      break
    }
  }

  if (rawEntries.length === 0) {
    errors.push('No transaction elements found in XML. Supported tags: Transaction, Entry, Pohyb, Row.')
    return { transactions: [], bankDetected, errors, skipped: 0, totalRows: 0 }
  }

  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i]

    try {
      const date = extractXMLValue(entry, ['Date', 'Datum', 'BookingDate', 'ValueDate', 'DatumPohybu'])
      const amount = extractXMLValue(entry, ['Amount', 'Castka', 'Částka', 'Objem'])
      const currency = extractXMLValue(entry, ['Currency', 'Mena', 'Měna']) || 'CZK'
      const counterpartyAccount = extractXMLValue(entry, ['CounterpartyAccount', 'Protiucet', 'Protiúčet', 'Account'])
      const counterpartyName = extractXMLValue(entry, ['CounterpartyName', 'NazevProtistrany', 'Name'])
      const vs = extractXMLValue(entry, ['VariableSymbol', 'VS', 'VariabilniSymbol'])
      const ks = extractXMLValue(entry, ['ConstantSymbol', 'KS', 'KonstantniSymbol'])
      const ss = extractXMLValue(entry, ['SpecificSymbol', 'SS', 'SpecifickySymbol'])
      const description = extractXMLValue(entry, ['Description', 'Popis', 'Poznamka', 'Poznámka', 'Message'])
      const reference = extractXMLValue(entry, ['Reference', 'ID', 'IdPohybu'])

      if (!date || !amount) {
        errors.push(`XML entry ${i + 1}: Missing date or amount`)
        skipped++
        continue
      }

      const normalizedDate = normalizeDate(date)
      const normalizedAmount = normalizeAmount(amount)

      if (!normalizedDate || isNaN(normalizedAmount)) {
        errors.push(`XML entry ${i + 1}: Could not parse date="${date}" or amount="${amount}"`)
        skipped++
        continue
      }

      transactions.push({
        date: normalizedDate,
        amount: normalizedAmount,
        currency,
        counterparty_account: counterpartyAccount || '',
        counterparty_name: counterpartyName || '',
        variable_symbol: vs || '',
        constant_symbol: ks || '',
        specific_symbol: ss || '',
        description: description || '',
        reference: reference || '',
      })
    } catch (e) {
      errors.push(`XML entry ${i + 1}: Parse error - ${e instanceof Error ? e.message : String(e)}`)
      skipped++
    }
  }

  return {
    transactions,
    bankDetected,
    errors,
    skipped,
    totalRows: rawEntries.length,
  }
}

// --------------------------------------------------------------------------
// Inline matching engine
// TODO: Move into @/lib/matching-engine
//
// Matching priority:
//   1. Variable symbol exact match (highest confidence)
//   2. Amount + date proximity match
//   3. Description keyword match (lowest confidence)
// --------------------------------------------------------------------------

async function matchTransactionsInline(
  companyId: string,
  transactions: ParsedTransaction[]
): Promise<MatchResult[]> {
  // Fetch outstanding (unpaid / partially paid) invoices for matching
  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, variable_symbol, amount, due_date, counterparty_name, status')
    .eq('company_id', companyId)
    .in('status', ['issued', 'sent', 'overdue', 'partially_paid'])

  if (error) {
    console.error('[matchTransactions] DB error fetching invoices:', error)
    // Return all as unmatched rather than failing
    return transactions.map((tx) => ({
      bank_transaction: tx,
      matched_invoice_id: null,
      match_confidence: 0,
      match_method: 'none' as const,
    }))
  }

  const invoiceList = invoices || []

  // Build lookup maps for efficient matching
  const byVariableSymbol = new Map<string, typeof invoiceList[number]>()
  for (const inv of invoiceList) {
    if (inv.variable_symbol) {
      byVariableSymbol.set(inv.variable_symbol.trim(), inv)
    }
  }

  const results: MatchResult[] = []
  const usedInvoiceIds = new Set<string>()

  for (const tx of transactions) {
    let bestMatch: MatchResult = {
      bank_transaction: tx,
      matched_invoice_id: null,
      match_confidence: 0,
      match_method: 'none',
    }

    // ---- Strategy 1: Variable symbol exact match ----
    if (tx.variable_symbol) {
      const vsNormalized = tx.variable_symbol.replace(/^0+/, '').trim()
      const invoice = byVariableSymbol.get(vsNormalized) || byVariableSymbol.get(tx.variable_symbol.trim())

      if (invoice && !usedInvoiceIds.has(invoice.id)) {
        // Check if amount also matches for higher confidence
        const amountMatches = Math.abs(Math.abs(tx.amount) - Math.abs(invoice.amount)) < 0.01
        const confidence = amountMatches ? 1.0 : 0.85

        bestMatch = {
          bank_transaction: tx,
          matched_invoice_id: invoice.id,
          match_confidence: confidence,
          match_method: 'variable_symbol',
        }
      }
    }

    // ---- Strategy 2: Amount + date proximity (only if VS match not found) ----
    if (bestMatch.match_confidence < 0.8) {
      for (const inv of invoiceList) {
        if (usedInvoiceIds.has(inv.id)) continue

        const amountDiff = Math.abs(Math.abs(tx.amount) - Math.abs(inv.amount))
        if (amountDiff > 0.01) continue // amounts must match exactly

        // Check date proximity (within 30 days of due date)
        const txDate = new Date(tx.date)
        const dueDate = new Date(inv.due_date)
        const daysDiff = Math.abs(
          (txDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff <= 30) {
          const dateConfidence = Math.max(0.5, 0.8 - daysDiff * 0.01)

          if (dateConfidence > bestMatch.match_confidence) {
            bestMatch = {
              bank_transaction: tx,
              matched_invoice_id: inv.id,
              match_confidence: Math.round(dateConfidence * 100) / 100,
              match_method: 'amount_date',
            }
          }
        }
      }
    }

    // ---- Strategy 3: Description keyword match (lowest priority) ----
    if (bestMatch.match_confidence < 0.5 && tx.description) {
      const txDesc = tx.description.toLowerCase()

      for (const inv of invoiceList) {
        if (usedInvoiceIds.has(inv.id)) continue

        // Check if invoice number appears in description
        const invNum = (inv.invoice_number || '').toLowerCase()
        if (invNum && txDesc.includes(invNum)) {
          bestMatch = {
            bank_transaction: tx,
            matched_invoice_id: inv.id,
            match_confidence: 0.6,
            match_method: 'description',
          }
          break
        }

        // Check if counterparty name matches
        const invName = (inv.counterparty_name || '').toLowerCase()
        const txName = tx.counterparty_name.toLowerCase()
        if (invName && txName && (txName.includes(invName) || invName.includes(txName))) {
          const amountClose = Math.abs(Math.abs(tx.amount) - Math.abs(inv.amount)) < 1.0
          if (amountClose) {
            bestMatch = {
              bank_transaction: tx,
              matched_invoice_id: inv.id,
              match_confidence: 0.55,
              match_method: 'description',
            }
          }
        }
      }
    }

    // Mark invoice as used if matched with high confidence
    if (bestMatch.matched_invoice_id && bestMatch.match_confidence >= 0.5) {
      usedInvoiceIds.add(bestMatch.matched_invoice_id)
    }

    results.push(bestMatch)
  }

  return results
}

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length
  const commas = (headerLine.match(/,/g) || []).length
  const tabs = (headerLine.match(/\t/g) || []).length

  if (tabs > semicolons && tabs > commas) return '\t'
  if (semicolons > commas) return ';' // Czech exports typically use semicolon
  return ','
}

function parseCSVLine(line: string, separator: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped double quote
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === separator && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  fields.push(current.trim())
  return fields
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate.toLowerCase())
    if (idx !== -1) return idx
  }
  // Partial match fallback
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.includes(candidate.toLowerCase()))
    if (idx !== -1) return idx
  }
  return -1
}

function safeGet(fields: string[], index: number): string {
  if (index === -1 || index >= fields.length) return ''
  return (fields[index] || '').replace(/^["']|["']$/g, '').trim()
}

/**
 * Normalize various Czech and international date formats to ISO YYYY-MM-DD.
 * Handles: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, D.M.YYYY, etc.
 */
function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim()

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10)
  }

  // DD.MM.YYYY or D.M.YYYY (Czech standard)
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0')
    const month = dotMatch[2].padStart(2, '0')
    const year = dotMatch[3]
    return `${year}-${month}-${day}`
  }

  // DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0')
    const month = slashMatch[2].padStart(2, '0')
    const year = slashMatch[3]
    return `${year}-${month}-${day}`
  }

  return null
}

/**
 * Normalize amount string to number.
 * Handles Czech formatting: "1 234,56" or "1.234,56" -> 1234.56
 * Also handles standard: "1234.56" or "-1234.56"
 */
function normalizeAmount(raw: string): number {
  let cleaned = raw.trim()

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[A-Za-z\s]/g, '')

  // Detect Czech formatting (comma as decimal separator)
  if (cleaned.includes(',')) {
    // Remove thousands separators (dots or spaces before the comma)
    const parts = cleaned.split(',')
    if (parts.length === 2) {
      const intPart = parts[0].replace(/[.\s]/g, '')
      const decPart = parts[1]
      cleaned = `${intPart}.${decPart}`
    }
  } else {
    // Standard format -- just remove any remaining non-numeric chars except dot and minus
    cleaned = cleaned.replace(/[^\d.\-]/g, '')
  }

  return parseFloat(cleaned)
}

function extractXMLValue(xml: string, tagNames: string[]): string | null {
  for (const tag of tagNames) {
    // Case-insensitive tag search
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
    const match = xml.match(regex)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}
