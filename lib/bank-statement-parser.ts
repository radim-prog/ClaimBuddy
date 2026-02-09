/**
 * Parser bankovnich vypisu pro ceske banky
 *
 * Podporovane formaty:
 * - CSV (Fio banka, Komercni banka, CSOB) s auto-detekci kodovani a oddelovacu
 * - XML (ISO 20022 camt.053)
 * - PDF (stub - vyzaduje Claude Vision API)
 *
 * Automaticka kategorizace transakci pro ceske ucetnictvi:
 * - IGNORED: splatky, mzdy, dane, pojisteni, zalohy, interni prevody
 * - NON_DEDUCTIBLE: pokuty, dary, reprezentace
 * - STANDARD: vse ostatni
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BankTransaction = {
  datum: string           // YYYY-MM-DD
  castka: number          // amount (positive=income, negative=expense)
  vs: string              // variable symbol
  ss: string              // specific symbol
  protiucet: string       // counterparty account
  zprava: string          // message/description
  typ: 'income' | 'expense'
  raw_line?: string       // original CSV line for debugging
}

export type TransactionCategory = 'STANDARD' | 'IGNORED' | 'NON_DEDUCTIBLE'

export type CategorizedTransaction = BankTransaction & {
  category: TransactionCategory
  category_reason?: string
}

// ---------------------------------------------------------------------------
// Categorization rules
// ---------------------------------------------------------------------------

interface CategoryRule {
  category: TransactionCategory
  reason: string
  patterns: RegExp[]
}

/**
 * Rules ordered from most specific to most general.
 * First match wins.
 */
const CATEGORY_RULES: CategoryRule[] = [
  // IGNORED - loan payments, leasing
  {
    category: 'IGNORED',
    reason: 'Splatka uveru / leasing',
    patterns: [
      /spl[aá]tk[ay]/i,
      /[uú]v[eě]r/i,
      /leasing/i,
      /p[uů]j[cč]k/i,
      /hypo/i,
    ],
  },
  // IGNORED - salary payments
  {
    category: 'IGNORED',
    reason: 'Mzdy / vyplaty zamestnancu',
    patterns: [
      /mzd[ay]/i,
      /v[yý]plat/i,
      /\bplat\b/i,
      /odm[eě]n[ay]/i,
    ],
  },
  // IGNORED - tax authority, VAT
  {
    category: 'IGNORED',
    reason: 'Financni urad / dane',
    patterns: [
      /finan[cč]n[ií]\s*[uú][řr]/i,
      /\bDPH\b/i,
      /da[nň]\s*(z\s*p[řr][ií]jm|silni[cč]n)/i,
      /\bFU\b/,
      /da[nň]ov/i,
      /\bda[nň]\b/i,
    ],
  },
  // IGNORED - social security (CSSZ/OSSZ)
  {
    category: 'IGNORED',
    reason: 'Socialni pojisteni (CSSZ)',
    patterns: [
      /[ČC][Ss][Ss][Zz]/i,
      /soci[aá]ln[ií]/i,
      /d[uů]chod/i,
      /\bOSSZ\b/i,
      /poji[sš]t[eě]n[ií]\s*soci/i,
    ],
  },
  // IGNORED - health insurance
  {
    category: 'IGNORED',
    reason: 'Zdravotni pojisteni',
    patterns: [
      /\bVZP\b/i,
      /\bZPMV\b/i,
      /\bOZP\b/i,
      /\bZP\b/i,
      /zdravotn[ií]/i,
      /poji[sš]t[eě]n[ií]\s*zdravot/i,
      /V[sš]eobecn[aá]\s*zdravotn/i,
      /Vojensk[aá]\s*zdravotn/i,
      /\bRBP\b/i,
      /[ČC]PZP/i,
    ],
  },
  // IGNORED - advances (tax, insurance)
  {
    category: 'IGNORED',
    reason: 'Zaloha (dane / pojisteni)',
    patterns: [
      /z[aá]loh[ay]/i,
    ],
  },
  // IGNORED - internal transfers between own accounts
  {
    category: 'IGNORED',
    reason: 'Interni prevod mezi vlastnimi ucty',
    patterns: [
      /intern[ií]\s*p[řr]evod/i,
      /p[řr]evod\s*mezi\s*(vlastn|[uú][čc]t)/i,
      /vlastn[ií]\s*[uú][čc]/i,
    ],
  },
  // NON_DEDUCTIBLE - fines, penalties
  {
    category: 'NON_DEDUCTIBLE',
    reason: 'Pokuta / penale (danove neuznatelne)',
    patterns: [
      /pokut[ay]?/i,
      /pen[aá]le/i,
      /sankc/i,
      /p[řr]ir[aá][žz]k/i,
    ],
  },
  // NON_DEDUCTIBLE - gifts, sponsorship
  {
    category: 'NON_DEDUCTIBLE',
    reason: 'Dar / sponzoring (danove neuznatelne)',
    patterns: [
      /\bdar[uy]?\b/i,
      /sponzor/i,
      /charit/i,
      /dobro[čc]inn/i,
    ],
  },
  // NON_DEDUCTIBLE - entertainment / representation
  {
    category: 'NON_DEDUCTIBLE',
    reason: 'Naklady na reprezentaci (danove neuznatelne)',
    patterns: [
      /reprezentac/i,
    ],
  },
]

// ---------------------------------------------------------------------------
// categorizeTransaction
// ---------------------------------------------------------------------------

/**
 * Categorize a single transaction based on its message, counterparty, and symbols.
 * Returns one of: STANDARD, IGNORED, NON_DEDUCTIBLE.
 */
export function categorizeTransaction(tx: BankTransaction): TransactionCategory {
  const searchText = [
    tx.zprava,
    tx.protiucet,
    tx.vs,
  ].filter(Boolean).join(' ')

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(searchText)) {
        return rule.category
      }
    }
  }

  return 'STANDARD'
}

/**
 * Categorize a transaction and return the reason string as well.
 * Internal helper used by parsers to produce CategorizedTransaction-compatible data.
 */
function categorizeWithReason(searchText: string): { category: TransactionCategory; reason: string } {
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(searchText)) {
        return { category: rule.category, reason: rule.reason }
      }
    }
  }
  return { category: 'STANDARD', reason: 'Standardni vydaj / prijem' }
}

// ---------------------------------------------------------------------------
// Encoding detection & conversion
// ---------------------------------------------------------------------------

/**
 * Detect encoding and convert to UTF-8 string.
 * Supports: UTF-8 (with/without BOM), Windows-1250 (cp1250), ISO-8859-2.
 */
function decodeContent(content: string | Buffer): string {
  if (typeof content === 'string') {
    // Already a string - strip BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      return content.slice(1)
    }
    return content
  }

  const buf = Buffer.from(content)

  // UTF-8 BOM
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return buf.slice(3).toString('utf-8')
  }

  // Try UTF-8 first - if no replacement chars appear, it is valid UTF-8
  const utf8 = buf.toString('utf-8')
  if (!utf8.includes('\uFFFD')) {
    return utf8
  }

  // Fallback: Windows-1250 (most common in Czech bank exports)
  return decodeWindows1250(buf)
}

/**
 * Decode a Buffer from Windows-1250 to a UTF-8 string.
 * Complete lookup table for bytes 0x80-0xFF covering all Czech characters.
 */
function decodeWindows1250(buf: Buffer): string {
  const WIN1250_MAP: Record<number, string> = {
    0x80: '\u20AC', // Euro sign
    0x82: '\u201A', 0x84: '\u201E', 0x85: '\u2026', 0x86: '\u2020',
    0x87: '\u2021', 0x89: '\u2030', 0x8A: '\u0160', // S-caron
    0x8B: '\u2039', 0x8C: '\u015A', 0x8D: '\u0164', // T-caron
    0x8E: '\u017D', // Z-caron
    0x8F: '\u0179',
    0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C', 0x94: '\u201D',
    0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
    0x99: '\u2122', 0x9A: '\u0161', // s-caron
    0x9B: '\u203A', 0x9C: '\u015B', 0x9D: '\u0165', // t-caron
    0x9E: '\u017E', // z-caron
    0x9F: '\u017A',
    0xA0: '\u00A0', 0xA1: '\u02C7', 0xA2: '\u02D8', 0xA3: '\u0141',
    0xA4: '\u00A4', 0xA5: '\u0104',
    0xA6: '\u00A6', 0xA7: '\u00A7', 0xA8: '\u00A8', 0xA9: '\u00A9',
    0xAA: '\u015E', 0xAB: '\u00AB', 0xAC: '\u00AC', 0xAD: '\u00AD',
    0xAE: '\u00AE', 0xAF: '\u017B',
    0xB0: '\u00B0', 0xB1: '\u00B1', 0xB2: '\u02DB', 0xB3: '\u0142',
    0xB4: '\u00B4', 0xB5: '\u00B5', 0xB6: '\u00B6', 0xB7: '\u00B7',
    0xB8: '\u00B8', 0xB9: '\u0105', 0xBA: '\u015F', 0xBB: '\u00BB',
    0xBC: '\u013D', 0xBD: '\u02DD', 0xBE: '\u013E', 0xBF: '\u017C',
    0xC0: '\u0154', 0xC1: '\u00C1', // A-acute
    0xC2: '\u00C2', 0xC3: '\u0102', 0xC4: '\u00C4',
    0xC5: '\u0139', 0xC6: '\u0106', 0xC7: '\u00C7',
    0xC8: '\u010C', // C-caron
    0xC9: '\u00C9', // E-acute
    0xCA: '\u0118', 0xCB: '\u00CB',
    0xCC: '\u011A', // E-caron
    0xCD: '\u00CD', // I-acute
    0xCE: '\u00CE', 0xCF: '\u010E', // D-caron
    0xD0: '\u0110', 0xD1: '\u0143', 0xD2: '\u0147',
    0xD3: '\u00D3', // O-acute
    0xD4: '\u00D4', 0xD5: '\u0150', 0xD6: '\u00D6',
    0xD7: '\u00D7', 0xD8: '\u0158', // R-caron
    0xD9: '\u016E', // U-ring
    0xDA: '\u00DA', // U-acute
    0xDB: '\u0170', 0xDC: '\u00DC',
    0xDD: '\u00DD', // Y-acute
    0xDE: '\u0162', 0xDF: '\u00DF',
    0xE0: '\u0155', 0xE1: '\u00E1', // a-acute
    0xE2: '\u00E2', 0xE3: '\u0103', 0xE4: '\u00E4',
    0xE5: '\u013A', 0xE6: '\u0107', 0xE7: '\u00E7',
    0xE8: '\u010D', // c-caron
    0xE9: '\u00E9', // e-acute
    0xEA: '\u0119', 0xEB: '\u00EB',
    0xEC: '\u011B', // e-caron
    0xED: '\u00ED', // i-acute
    0xEE: '\u00EE', 0xEF: '\u010F', // d-caron
    0xF0: '\u0111', 0xF1: '\u0144', 0xF2: '\u0148',
    0xF3: '\u00F3', // o-acute
    0xF4: '\u00F4', 0xF5: '\u0151', 0xF6: '\u00F6',
    0xF7: '\u00F7', 0xF8: '\u0159', // r-caron
    0xF9: '\u016F', // u-ring
    0xFA: '\u00FA', // u-acute
    0xFB: '\u0171', 0xFC: '\u00FC',
    0xFD: '\u00FD', // y-acute
    0xFE: '\u0163', 0xFF: '\u02D9',
  }

  let result = ''
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]
    if (byte < 0x80) {
      result += String.fromCharCode(byte)
    } else {
      result += WIN1250_MAP[byte] ?? String.fromCharCode(byte)
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/**
 * Detect the CSV separator by analyzing the first few lines.
 * Supports: semicolon (;), comma (,), tab.
 * Czech banks almost always use semicolon.
 */
function detectSeparator(lines: string[]): string {
  const sample = lines.slice(0, Math.min(5, lines.length))

  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 }
  for (const line of sample) {
    counts[';'] += (line.match(/;/g) || []).length
    counts[','] += (line.match(/,/g) || []).length
    counts['\t'] += (line.match(/\t/g) || []).length
  }

  // Semicolon is the default for Czech banks
  if (counts[';'] >= counts[','] && counts[';'] >= counts['\t']) return ';'
  if (counts['\t'] >= counts[',']) return '\t'
  return ','
}

/**
 * Parse a single CSV line respecting quoted fields.
 * Handles escaped quotes ("") inside quoted fields.
 */
function parseCSVLine(line: string, separator: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        // Double-quote = escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === separator) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current.trim())

  return fields
}

/**
 * Parse a Czech-formatted number (e.g., "1 234,56" or "-1234.56") to a JS number.
 * Returns NaN on failure, 0 for empty strings.
 */
function parseCzechNumber(value: string): number {
  if (!value || value.trim() === '') return 0

  let cleaned = value.trim()
    .replace(/\s/g, '')        // Remove spaces (thousands separator)
    .replace(/\u00A0/g, '')    // Non-breaking space

  // Both dot and comma present: dot is thousands, comma is decimal (1.234,56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // Only comma: it is the decimal separator
    cleaned = cleaned.replace(',', '.')
  }

  return parseFloat(cleaned)
}

/**
 * Parse a Czech date string into YYYY-MM-DD format.
 * Supports: DD.MM.YYYY, DD. MM. YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYYMMDD.
 */
function parseCzechDate(value: string): string {
  if (!value || value.trim() === '') return ''

  const trimmed = value.trim()

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }

  // DD.MM.YYYY or DD. MM. YYYY
  const dotMatch = trimmed.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
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

  // YYYYMMDD (no separators)
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`
  }

  return trimmed
}

// ---------------------------------------------------------------------------
// CSV bank format detection
// ---------------------------------------------------------------------------

type BankFormat = 'fio' | 'kb' | 'csob' | 'generic'

interface CSVColumnMapping {
  date: number
  amount: number
  variable_symbol: number
  specific_symbol: number
  counter_account: number
  message: number
  type_column: number  // -1 if type is inferred from amount sign
}

/**
 * Find a column index in the header row by matching against a list of candidate names.
 * Returns -1 if not found.
 */
function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h === candidate || h.includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Safely get a field value from a parsed CSV row.
 * Returns '' for out-of-bounds or missing indices.
 */
function getField(fields: string[], index: number): string {
  if (index < 0 || index >= fields.length) return ''
  return (fields[index] || '').replace(/^"|"$/g, '').trim()
}

/**
 * Detect the bank format from the CSV header row and return column mappings.
 *
 * Supported banks:
 * - Fio banka: columns Datum, Objem, VS, KS, SS, Protiucet, Poznamka, Typ
 * - Komercni banka: columns Datum splatnosti, Castka, VS, Cislo protiuctu, Nazev protiuctu
 * - CSOB: columns datum zauctovani, castka v mene uctu, VS, IBAN protiuctu
 * - Generic fallback with heuristic matching
 */
function detectBankFormat(headerFields: string[]): { format: BankFormat; mapping: CSVColumnMapping } {
  const headerLower = headerFields.map(h => h.toLowerCase().replace(/"/g, '').trim())
  const headerJoined = headerLower.join('|')

  // Fio banka
  if (headerJoined.includes('id pohybu') || headerJoined.includes('id operace') ||
      (headerJoined.includes('datum') && headerJoined.includes('objem') && headerJoined.includes('proti'))) {
    return {
      format: 'fio',
      mapping: {
        date: findColumn(headerLower, ['datum']),
        amount: findColumn(headerLower, ['objem', 'castka', 'částka']),
        variable_symbol: findColumn(headerLower, ['vs', 'variabilní symbol', 'variabilni symbol']),
        specific_symbol: findColumn(headerLower, ['ss', 'specifický symbol', 'specificky symbol']),
        counter_account: findColumn(headerLower, ['protiúčet', 'protiucet', 'číslo protiúčtu']),
        message: findColumn(headerLower, ['poznámka', 'poznamka', 'zpráva pro příjemce', 'zprava pro prijemce', 'komentář', 'komentar']),
        type_column: findColumn(headerLower, ['typ', 'typ pohybu']),
      },
    }
  }

  // Komercni banka
  if (headerJoined.includes('datum splatnosti') || headerJoined.includes('datum zaúčtování') ||
      (headerJoined.includes('částka') && headerJoined.includes('název protiúčtu'))) {
    return {
      format: 'kb',
      mapping: {
        date: findColumn(headerLower, ['datum splatnosti', 'datum zaúčtování', 'datum zauctovani', 'datum']),
        amount: findColumn(headerLower, ['částka', 'castka', 'objem']),
        variable_symbol: findColumn(headerLower, ['vs', 'variabilní symbol', 'variabilni symbol']),
        specific_symbol: findColumn(headerLower, ['ss', 'specifický symbol', 'specificky symbol']),
        counter_account: findColumn(headerLower, ['číslo protiúčtu', 'cislo protiuctu', 'protiúčet', 'protiucet']),
        message: findColumn(headerLower, ['zpráva pro příjemce', 'zprava pro prijemce', 'poznámka', 'poznamka', 'popis transakce']),
        type_column: -1, // KB uses amount sign, no type column
      },
    }
  }

  // CSOB
  if (headerJoined.includes('číslo účtu') || headerJoined.includes('cislo uctu') ||
      headerJoined.includes('iban protiúčtu') || headerJoined.includes('iban protiuctu') ||
      (headerJoined.includes('datum') && headerJoined.includes('castka v mene uctu'))) {
    return {
      format: 'csob',
      mapping: {
        date: findColumn(headerLower, ['datum zaúčtování', 'datum zauctovani', 'datum']),
        amount: findColumn(headerLower, ['částka v měně účtu', 'castka v mene uctu', 'částka', 'castka']),
        variable_symbol: findColumn(headerLower, ['vs', 'variabilní symbol', 'variabilni symbol']),
        specific_symbol: findColumn(headerLower, ['ss', 'specifický symbol', 'specificky symbol']),
        counter_account: findColumn(headerLower, ['iban protiúčtu', 'iban protiuctu', 'číslo protiúčtu', 'cislo protiuctu', 'protiúčet']),
        message: findColumn(headerLower, ['zpráva pro příjemce', 'zprava pro prijemce', 'poznámka', 'poznamka', 'název protiúčtu', 'nazev protiuctu']),
        type_column: -1,
      },
    }
  }

  // Generic fallback
  return {
    format: 'generic',
    mapping: {
      date: findColumn(headerLower, ['datum', 'date', 'datum zaúčtování', 'datum splatnosti']),
      amount: findColumn(headerLower, ['částka', 'castka', 'objem', 'amount', 'suma']),
      variable_symbol: findColumn(headerLower, ['vs', 'variabilní symbol', 'variabilni symbol', 'variable symbol']),
      specific_symbol: findColumn(headerLower, ['ss', 'specifický symbol', 'specificky symbol', 'specific symbol']),
      counter_account: findColumn(headerLower, ['protiúčet', 'protiucet', 'counter account', 'číslo protiúčtu', 'cislo protiuctu']),
      message: findColumn(headerLower, ['poznámka', 'poznamka', 'zpráva', 'zprava', 'message', 'popis', 'note']),
      type_column: findColumn(headerLower, ['typ', 'type', 'typ pohybu']),
    },
  }
}

// ---------------------------------------------------------------------------
// CSV metadata extraction (header lines before the data table)
// ---------------------------------------------------------------------------

interface CSVMetadata {
  dataStartLine: number  // Index of the header row (column names)
}

/**
 * Find the header row index by scanning the first 20 lines for column name patterns.
 * Czech bank CSVs often have several metadata lines before the actual table.
 */
function findHeaderLine(lines: string[]): number {
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const lower = lines[i].toLowerCase()
    if (
      (lower.includes('datum') && (lower.includes('částka') || lower.includes('castka') || lower.includes('objem'))) ||
      (lower.includes('date') && lower.includes('amount')) ||
      lower.includes('id pohybu') ||
      lower.includes('id operace')
    ) {
      return i
    }
  }
  // If no recognizable header found, assume first line
  return 0
}

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------

/**
 * Parse a CSV bank statement file.
 *
 * Auto-detects:
 * - Encoding: UTF-8 (with/without BOM), Windows-1250 (cp1250)
 * - Separator: semicolon (;), comma (,), tab
 * - Bank format: Fio banka, Komercni banka, CSOB, or generic
 *
 * @param content - Raw CSV content as a string (any encoding will be handled)
 * @returns Array of parsed BankTransaction objects
 */
export async function parseCSV(content: string): Promise<BankTransaction[]> {
  const decoded = decodeContent(content)

  // Split into lines, remove trailing empty line
  const rawLines = decoded.split(/\r?\n/)
  const lines = rawLines.filter((line, idx) => {
    if (idx === rawLines.length - 1 && line.trim() === '') return false
    return true
  })

  if (lines.length === 0) {
    return []
  }

  const separator = detectSeparator(lines)
  const headerLineIndex = findHeaderLine(lines)

  const headerLine = lines[headerLineIndex]
  if (!headerLine) {
    return []
  }

  const headerFields = parseCSVLine(headerLine, separator)
  const { mapping } = detectBankFormat(headerFields)

  const transactions: BankTransaction[] = []

  // Parse data rows (everything after the header)
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Skip footer/summary lines
    const lower = line.toLowerCase()
    if (
      lower.startsWith('součet') || lower.startsWith('soucet') ||
      lower.startsWith('celkem') || lower.startsWith('zůstatek') ||
      lower.startsWith('zustatek') || lower.startsWith('konečný') ||
      lower.startsWith('konecny') || lower.startsWith('počáteční') ||
      lower.startsWith('pocatecni')
    ) {
      continue
    }

    const fields = parseCSVLine(line, separator)

    // Skip rows with too few fields (likely footer or metadata)
    if (fields.length < 3) {
      continue
    }

    const dateStr = parseCzechDate(getField(fields, mapping.date))
    const rawAmount = parseCzechNumber(getField(fields, mapping.amount))

    // Skip rows without a valid date
    if (!dateStr || dateStr.length < 8) {
      continue
    }

    // Skip rows with invalid or zero amount
    if (isNaN(rawAmount) || rawAmount === 0) {
      continue
    }

    const variableSymbol = getField(fields, mapping.variable_symbol)
    const specificSymbol = getField(fields, mapping.specific_symbol)
    const counterAccount = getField(fields, mapping.counter_account)
    const message = getField(fields, mapping.message)

    // Determine transaction type from type column or amount sign
    let typ: 'income' | 'expense'
    if (mapping.type_column !== -1) {
      const typeStr = getField(fields, mapping.type_column).toLowerCase()
      typ = (
        typeStr.includes('příjem') || typeStr.includes('prijem') ||
        typeStr.includes('credit') || typeStr.includes('připsán') ||
        typeStr.includes('pripsan')
      ) ? 'income' : 'expense'
    } else {
      typ = rawAmount >= 0 ? 'income' : 'expense'
    }

    // castka preserves sign: positive = income, negative = expense
    const castka = rawAmount

    transactions.push({
      datum: dateStr,
      castka,
      vs: variableSymbol,
      ss: specificSymbol,
      protiucet: counterAccount,
      zprava: message,
      typ,
      raw_line: line,
    })
  }

  return transactions
}

// ---------------------------------------------------------------------------
// parseXML - ISO 20022 camt.053
// ---------------------------------------------------------------------------

/**
 * Extract text content from an XML tag using regex.
 * If customRegex is provided, use it directly (must have capture group 1).
 */
function extractXMLValue(xml: string, tagName: string, customRegex?: RegExp): string {
  if (customRegex) {
    const match = xml.match(customRegex)
    return match ? match[1].trim() : ''
  }

  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`)
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Parse an XML bank statement in ISO 20022 camt.053 format.
 *
 * Extracts transaction entries from <Ntry> elements, including:
 * - Booking date, amount, credit/debit indicator
 * - Variable and specific symbols from references
 * - Counterparty account (IBAN or local number)
 * - Unstructured remittance information (message)
 *
 * @param content - Raw XML content as a string
 * @returns Array of parsed BankTransaction objects
 */
export async function parseXML(content: string): Promise<BankTransaction[]> {
  const decoded = decodeContent(content)

  const transactions: BankTransaction[] = []
  const entryBlocks = decoded.match(/<Ntry>[\s\S]*?<\/Ntry>/g) || []

  for (const entry of entryBlocks) {
    // --- Date ---
    // Try BookgDt first, then ValDt
    const bookingDtBlock = entry.match(/<BookgDt>[\s\S]*?<\/BookgDt>/)?.[0] || ''
    const valueDtBlock = entry.match(/<ValDt>[\s\S]*?<\/ValDt>/)?.[0] || ''

    let dateRaw = extractXMLValue(bookingDtBlock, 'Dt')
    if (!dateRaw) dateRaw = extractXMLValue(valueDtBlock, 'Dt')
    if (!dateRaw) dateRaw = extractXMLValue(entry, 'Dt')

    const datum = parseCzechDate(dateRaw)
    if (!datum) continue

    // --- Amount ---
    const amountStr = extractXMLValue(entry, 'Amt') || '0'
    const absAmount = Math.abs(parseFloat(amountStr))
    if (isNaN(absAmount) || absAmount === 0) continue

    // --- Credit/Debit ---
    const cdtDbt = extractXMLValue(entry, 'CdtDbtInd') || ''
    const typ: 'income' | 'expense' = cdtDbt === 'CRDT' ? 'income' : 'expense'
    const castka = typ === 'income' ? absAmount : -absAmount

    // --- Transaction details block ---
    const txDtls = entry.match(/<TxDtls>[\s\S]*?<\/TxDtls>/)?.[0] || entry

    // --- Variable symbol and Specific symbol ---
    const endToEndId = extractXMLValue(txDtls, 'EndToEndId') || ''
    const pmtInfId = extractXMLValue(txDtls, 'PmtInfId') || ''

    let vs = ''
    let ss = ''

    // Czech banks store VS/SS in Refs/Othr blocks
    const refBlocks = txDtls.match(/<Ref>[\s\S]*?<\/Ref>/g) || []
    for (const ref of refBlocks) {
      const tp = extractXMLValue(ref, 'Tp') || extractXMLValue(ref, 'Cd') || ''
      const val = extractXMLValue(ref, 'Ref') || ''
      if (tp.includes('VS') || tp.includes('VARIABLE')) vs = val
      if (tp.includes('SS') || tp.includes('SPECIFIC')) ss = val
    }

    // Also check CdtrRef / Strd blocks for VS
    if (!vs) {
      const strdBlock = txDtls.match(/<Strd>[\s\S]*?<\/Strd>/)?.[0] || ''
      if (strdBlock) {
        const credRefInf = extractXMLValue(strdBlock, 'Ref')
        if (credRefInf) vs = credRefInf
      }
    }

    // Fallback: extract VS from EndToEndId or PmtInfId
    if (!vs && endToEndId) {
      const vsMatch = endToEndId.match(/VS[:\s]*(\d+)/i) || endToEndId.match(/^(\d{1,10})$/)
      if (vsMatch) vs = vsMatch[1]
    }
    if (!vs && pmtInfId) {
      const vsMatch = pmtInfId.match(/VS[:\s]*(\d+)/i)
      if (vsMatch) vs = vsMatch[1]
    }

    // --- Counterparty account ---
    let protiucet = ''

    // For credit (income) the counterparty is the debtor, for debit (expense) the creditor
    const dbtrAcct = entry.match(/<DbtrAcct>[\s\S]*?<\/DbtrAcct>/)?.[0] || ''
    const cdtrAcct = entry.match(/<CdtrAcct>[\s\S]*?<\/CdtrAcct>/)?.[0] || ''
    const counterAcctBlock = typ === 'income' ? dbtrAcct : cdtrAcct

    if (counterAcctBlock) {
      protiucet = extractXMLValue(counterAcctBlock, 'IBAN') ||
                  extractXMLValue(counterAcctBlock, 'Id') || ''
    }

    // Also try the party name (Nm) as fallback for display
    if (!protiucet) {
      const dbtrBlock = entry.match(/<Dbtr>[\s\S]*?<\/Dbtr>/)?.[0] || ''
      const cdtrBlock = entry.match(/<Cdtr>[\s\S]*?<\/Cdtr>/)?.[0] || ''
      const counterPartyBlock = typ === 'income' ? dbtrBlock : cdtrBlock
      if (counterPartyBlock) {
        protiucet = extractXMLValue(counterPartyBlock, 'Nm') || ''
      }
    }

    // --- Message ---
    const zprava = (
      extractXMLValue(txDtls, 'Ustrd') ||
      extractXMLValue(txDtls, 'AddtlNtryInf') ||
      extractXMLValue(entry, 'AddtlNtryInf') ||
      extractXMLValue(txDtls, 'AddtlTxInf') ||
      ''
    ).trim()

    transactions.push({
      datum,
      castka,
      vs,
      ss,
      protiucet,
      zprava,
      typ,
    })
  }

  return transactions
}

// ---------------------------------------------------------------------------
// parsePDF - Stub
// ---------------------------------------------------------------------------

/**
 * Parse a PDF bank statement.
 *
 * STUB: PDF parsing requires OCR via the Claude Vision API.
 * Always throws an error instructing the caller to configure the API key
 * or use a CSV/XML export instead.
 *
 * @param _buffer - PDF file content as a Buffer
 * @throws Error always - PDF parsing is not implemented without the API key
 */
export async function parsePDF(_buffer: Buffer): Promise<BankTransaction[]> {
  throw new Error(
    'Claude Vision API key not configured. ' +
    'PDF bank statements require OCR processing via the Anthropic Claude Vision API. ' +
    'Please set ANTHROPIC_API_KEY in your environment, or export your bank statement as CSV or XML instead.'
  )
}

// ---------------------------------------------------------------------------
// Utility: categorize all transactions in a batch
// ---------------------------------------------------------------------------

/**
 * Categorize an array of transactions and return them with category metadata.
 * Convenience wrapper around categorizeTransaction for batch processing.
 */
export function categorizeTransactions(transactions: BankTransaction[]): CategorizedTransaction[] {
  return transactions.map(tx => {
    const searchText = [tx.zprava, tx.protiucet, tx.vs].filter(Boolean).join(' ')
    const { category, reason } = categorizeWithReason(searchText)

    return {
      ...tx,
      category,
      category_reason: reason,
    }
  })
}

// ---------------------------------------------------------------------------
// Auto-detect format and parse
// ---------------------------------------------------------------------------

/**
 * Auto-detect file format from filename extension and content, then parse.
 *
 * Detection order:
 * 1. File extension (.csv, .xml, .pdf)
 * 2. Content sniffing (XML declaration, PDF magic bytes)
 * 3. Fallback to CSV
 *
 * @param content - File content as string or Buffer
 * @param filename - Original filename (used for extension detection)
 * @returns Array of parsed BankTransaction objects
 */
export async function parseStatementAuto(
  content: string | Buffer,
  filename: string,
): Promise<BankTransaction[]> {
  const ext = filename.toLowerCase().split('.').pop() || ''

  // PDF - by extension or magic bytes (%PDF)
  if (ext === 'pdf') {
    const buf = typeof content === 'string' ? Buffer.from(content) : content
    return parsePDF(buf)
  }
  if (Buffer.isBuffer(content) && content.length >= 4 && content[0] === 0x25 && content[1] === 0x50 && content[2] === 0x44 && content[3] === 0x46) {
    return parsePDF(content)
  }

  // Convert to string for text-based formats
  const text = typeof content === 'string' ? content : decodeContent(content)

  // XML - by extension or content
  if (ext === 'xml' || text.trimStart().startsWith('<?xml') || text.includes('<Document') || text.includes('camt.053')) {
    return parseXML(text)
  }

  // CSV - by extension or fallback
  if (ext === 'csv' || ext === 'txt' || ext === 'tsv' || ext === '') {
    return parseCSV(text)
  }

  // Heuristic: if it starts with '<', treat as XML
  if (text.trimStart().startsWith('<')) {
    return parseXML(text)
  }

  // Final fallback: CSV
  return parseCSV(text)
}
