/**
 * Bank statement parser — structured format detection and parsing.
 * Supports: CSV (FIO, KB, ČSOB, mBank, Air Bank), MT940, PDF/image (OCR fallback).
 *
 * Decision tree:
 *   .csv → papaparse with per-bank column mapping
 *   .sta / .mt940 / MT940 content → mt940-js
 *   .pdf / .jpg / .png → Kimi AI OCR (existing pipeline)
 */

import Papa from 'papaparse'
import iconv from 'iconv-lite'

export type ParsedTransaction = {
  date: string
  amount: number
  currency: string
  variable_symbol?: string | null
  constant_symbol?: string | null
  specific_symbol?: string | null
  counterparty_account?: string | null
  counterparty_name?: string | null
  counterparty_bank_code?: string | null
  description?: string | null
}

export type ParsedStatement = {
  account_number?: string | null
  bank_name?: string | null
  period_from?: string | null
  period_to?: string | null
  transactions: ParsedTransaction[]
  parse_method: 'csv' | 'mt940' | 'ocr'
}

export type StatementFormat = 'csv' | 'mt940' | 'pdf' | 'image' | 'unknown'

// ============================================================
// FORMAT DETECTION
// ============================================================

/**
 * Detect file format from MIME type, extension, and content.
 */
export function detectFormat(
  filename: string,
  mimeType: string,
  buffer: Buffer
): StatementFormat {
  const ext = filename.toLowerCase().split('.').pop() || ''

  // CSV
  if (mimeType === 'text/csv' || ext === 'csv') return 'csv'

  // MT940
  if (ext === 'sta' || ext === 'mt940') return 'mt940'
  // Content sniff: MT940 starts with :20: or {1:
  const head = buffer.subarray(0, 100).toString('utf-8')
  if (head.includes(':20:') || head.includes(':25:') || head.startsWith('{1:')) return 'mt940'

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf'

  // Images
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'

  return 'unknown'
}

// ============================================================
// CSV PARSING — per-bank profiles
// ============================================================

type BankProfile = {
  name: string
  dateCol: string
  amountCol: string
  currencyCol?: string
  vsCol?: string
  ksCol?: string
  ssCol?: string
  accountCol?: string
  nameCol?: string
  descCol?: string
  bankCodeCol?: string
}

const BANK_PROFILES: BankProfile[] = [
  {
    // FIO banka
    name: 'FIO',
    dateCol: 'Datum',
    amountCol: 'Objem',
    currencyCol: 'Měna',
    vsCol: 'VS',
    ksCol: 'KS',
    ssCol: 'SS',
    accountCol: 'Protiúčet',
    nameCol: 'Název protiúčtu',
    descCol: 'Zpráva pro příjemce',
    bankCodeCol: 'Kód banky',
  },
  {
    // KB (Komerční banka)
    name: 'KB',
    dateCol: 'Datum splatnosti',
    amountCol: 'Částka',
    currencyCol: 'Měna',
    vsCol: 'Variabilní symbol',
    ksCol: 'Konstantní symbol',
    ssCol: 'Specifický symbol',
    accountCol: 'Číslo protiúčtu',
    nameCol: 'Název protiúčtu',
    descCol: 'Popis transakce',
  },
  {
    // ČSOB
    name: 'ČSOB',
    dateCol: 'datum zaúčtování',
    amountCol: 'částka',
    currencyCol: 'měna',
    vsCol: 'variabilní symbol',
    ksCol: 'konstantní symbol',
    ssCol: 'specifický symbol',
    accountCol: 'protiúčet',
    nameCol: 'název protiúčtu',
    descCol: 'poznámka',
  },
  {
    // Air Bank
    name: 'Air Bank',
    dateCol: 'Datum provedení',
    amountCol: 'Částka v měně účtu',
    currencyCol: 'Měna účtu',
    vsCol: 'VS',
    accountCol: 'Číslo účtu protistrany',
    nameCol: 'Název protistrany',
    descCol: 'Zpráva',
  },
  {
    // Generic fallback — tries common Czech column names
    name: 'Generic',
    dateCol: 'Datum',
    amountCol: 'Částka',
    currencyCol: 'Měna',
    vsCol: 'VS',
    ksCol: 'KS',
    accountCol: 'Protiúčet',
    nameCol: 'Název',
    descCol: 'Popis',
  },
]

/**
 * Detect which bank profile matches the CSV headers.
 */
function detectBankProfile(headers: string[]): BankProfile {
  const headerSet = new Set(headers.map(h => h.trim().toLowerCase()))

  for (const profile of BANK_PROFILES) {
    // Check if the key columns exist (date + amount)
    if (
      headerSet.has(profile.dateCol.toLowerCase()) &&
      headerSet.has(profile.amountCol.toLowerCase())
    ) {
      return profile
    }
  }

  // Fallback to generic
  return BANK_PROFILES[BANK_PROFILES.length - 1]
}

/**
 * Find column value case-insensitively.
 */
function getCol(row: Record<string, string>, colName?: string): string | null {
  if (!colName) return null
  const lower = colName.toLowerCase()
  for (const [key, value] of Object.entries(row)) {
    if (key.trim().toLowerCase() === lower) return value?.trim() || null
  }
  return null
}

/**
 * Parse amount string — handles Czech formatting (1 234,56 or -1234.56).
 */
function parseAmount(raw: string | null): number {
  if (!raw) return 0
  // Remove spaces and non-breaking spaces
  let cleaned = raw.replace(/[\s\u00a0]/g, '')
  // Czech format: comma as decimal separator
  cleaned = cleaned.replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Parse date string — tries multiple formats.
 */
function parseDate(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // DD.MM.YYYY
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`
  }

  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`
  }

  return null
}

/**
 * Parse CSV bank statement into transactions.
 */
export function parseCSV(text: string, bankProfile?: BankProfile): ParsedStatement {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (!result.data || result.data.length === 0) {
    return { transactions: [], parse_method: 'csv' }
  }

  const headers = result.meta.fields || []
  const profile = bankProfile || detectBankProfile(headers)

  const transactions: ParsedTransaction[] = []
  let minDate: string | null = null
  let maxDate: string | null = null

  for (const row of result.data) {
    const date = parseDate(getCol(row, profile.dateCol))
    const amount = parseAmount(getCol(row, profile.amountCol))

    if (!date || amount === 0) continue

    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date

    transactions.push({
      date,
      amount,
      currency: getCol(row, profile.currencyCol) || 'CZK',
      variable_symbol: getCol(row, profile.vsCol),
      constant_symbol: getCol(row, profile.ksCol),
      specific_symbol: getCol(row, profile.ssCol),
      counterparty_account: getCol(row, profile.accountCol),
      counterparty_name: getCol(row, profile.nameCol),
      counterparty_bank_code: getCol(row, profile.bankCodeCol),
      description: getCol(row, profile.descCol),
    })
  }

  return {
    bank_name: profile.name !== 'Generic' ? profile.name : null,
    period_from: minDate,
    period_to: maxDate,
    transactions,
    parse_method: 'csv',
  }
}

// ============================================================
// MT940 PARSING
// ============================================================

/**
 * Parse MT940/STA format using mt940-js.
 */
export async function parseMT940(buffer: Buffer): Promise<ParsedStatement> {
  // mt940-js exports { read } which returns a promise of statements
  const mt940 = await import('mt940-js')
  const statements = await mt940.read(buffer)

  const transactions: ParsedTransaction[] = []
  let accountNumber: string | null = null
  let minDate: string | null = null
  let maxDate: string | null = null

  for (const stmt of statements) {
    if (stmt.accountId && !accountNumber) {
      accountNumber = stmt.accountId
    }

    for (const tx of stmt.transactions || []) {
      // mt940-js valueDate is a string "YYMMDD" or "YYYY-MM-DD"
      const date = normalizeMT940Date(tx.valueDate)
      if (!date) continue

      if (!minDate || date < minDate) minDate = date
      if (!maxDate || date > maxDate) maxDate = date

      // Amount sign: isCredit = positive, isExpense = negative
      const amount = tx.isExpense ? -Math.abs(tx.amount) : Math.abs(tx.amount)

      // Extract VS from customerReference or description
      let variableSymbol: string | null = null
      const refText = [tx.customerReference, tx.description].filter(Boolean).join(' ')
      const vsMatch = refText.match(/VS[:\s]*(\d+)/i) || refText.match(/\/VS\/(\d+)/)
      if (vsMatch) variableSymbol = vsMatch[1]

      transactions.push({
        date,
        amount,
        currency: tx.currency || 'CZK',
        variable_symbol: variableSymbol,
        counterparty_name: null,
        description: tx.description || null,
      })
    }
  }

  return {
    account_number: accountNumber,
    period_from: minDate,
    period_to: maxDate,
    transactions,
    parse_method: 'mt940',
  }
}

/**
 * Normalize MT940 date string to YYYY-MM-DD.
 */
function normalizeMT940Date(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // YYMMDD format
  if (/^\d{6}$/.test(trimmed)) {
    const yy = parseInt(trimmed.substring(0, 2), 10)
    const mm = trimmed.substring(2, 4)
    const dd = trimmed.substring(4, 6)
    const year = yy >= 50 ? 1900 + yy : 2000 + yy
    return `${year}-${mm}-${dd}`
  }

  // YYYYMMDD format
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`
  }

  return null
}

// ============================================================
// ORCHESTRATOR
// ============================================================

/**
 * Parse bank statement: detect format → structured parse → fallback to OCR.
 * Returns null if format requires OCR (caller should use Kimi AI).
 */
export async function parseBankStatement(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParsedStatement | null> {
  const format = detectFormat(filename, mimeType, buffer)

  switch (format) {
    case 'csv': {
      // Try UTF-8 first, fall back to Win-1250 (common Czech bank encoding)
      let text = buffer.toString('utf-8')
      let result = parseCSV(text)
      if (result.transactions.length === 0) {
        text = iconv.decode(buffer, 'win1250')
        result = parseCSV(text)
      }
      return result
    }
    case 'mt940': {
      return parseMT940(buffer)
    }
    case 'pdf':
    case 'image':
    case 'unknown':
      // Caller should use OCR fallback
      return null
  }
}
