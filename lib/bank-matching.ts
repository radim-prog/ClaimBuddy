/**
 * Bank transaction matching engine
 * Matches bank transactions with documents and invoices using 3 strategies:
 * 1. Variable symbol match (confidence 0.95)
 * 2. Amount + date match (confidence 0.70)
 * 3. Fuzzy match by name/description (confidence 0.40)
 */

type MatchableDocument = {
  id: string
  variable_symbol?: string | null
  total_with_vat?: number | null
  total_amount?: number | null
  date_issued?: string | null
  date_tax?: string | null
  supplier_name?: string | null
  supplier_ico?: string | null
}

type MatchableInvoice = {
  id: string
  variable_symbol?: string | null
  total_with_vat?: number | null
  issue_date?: string | null
  partner?: { name?: string; ico?: string } | null
  partner_name?: string | null
}

type BankTransaction = {
  id: string
  amount: number
  variable_symbol?: string | null
  counterparty_name?: string | null
  counterparty_account?: string | null
  transaction_date: string
  description?: string | null
}

type MatchableDohodaVykaz = {
  id: string
  cista_mzda: number
  period: string
  employee_name?: string // "Jan Novák"
}

export type MatchResult = {
  document_id?: string
  invoice_id?: string
  dohoda_mesic_id?: string
  confidence: number
  method: 'variable_symbol' | 'amount_date' | 'fuzzy' | 'manual' | 'dohoda_amount_name' | 'dohoda_amount'
}

export function matchByVariableSymbol(
  tx: BankTransaction,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[]
): MatchResult | null {
  if (!tx.variable_symbol) return null

  const vs = tx.variable_symbol.replace(/\D/g, '')
  if (!vs) return null

  // Check documents first
  for (const doc of documents) {
    const docVs = doc.variable_symbol?.replace(/\D/g, '')
    if (docVs && docVs === vs) {
      return { document_id: doc.id, confidence: 0.95, method: 'variable_symbol' }
    }
  }

  // Check invoices
  for (const inv of invoices) {
    const invVs = inv.variable_symbol?.replace(/\D/g, '')
    if (invVs && invVs === vs) {
      return { invoice_id: inv.id, confidence: 0.95, method: 'variable_symbol' }
    }
  }

  return null
}

export function matchByAmountDate(
  tx: BankTransaction,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[]
): MatchResult | null {
  const absAmount = Math.abs(tx.amount)
  const txDate = new Date(tx.transaction_date)
  const tolerance = 0.01 // 1 cent tolerance for rounding
  const dayRange = 30 // within 30 days

  // Expenses → match documents
  if (tx.amount < 0) {
    for (const doc of documents) {
      const docAmount = doc.total_with_vat ?? doc.total_amount ?? 0
      if (Math.abs(Math.abs(docAmount) - absAmount) > tolerance) continue

      const docDate = doc.date_issued || doc.date_tax
      if (!docDate) continue

      const diffDays = Math.abs(
        (txDate.getTime() - new Date(docDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays <= dayRange) {
        return { document_id: doc.id, confidence: 0.70, method: 'amount_date' }
      }
    }
  }

  // Income → match invoices
  if (tx.amount > 0) {
    for (const inv of invoices) {
      const invAmount = inv.total_with_vat ?? 0
      if (Math.abs(invAmount - absAmount) > tolerance) continue

      const invDate = inv.issue_date
      if (!invDate) continue

      const diffDays = Math.abs(
        (txDate.getTime() - new Date(invDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays <= dayRange * 2) { // invoices can be paid later
        return { invoice_id: inv.id, confidence: 0.70, method: 'amount_date' }
      }
    }
  }

  return null
}

export function matchFuzzy(
  tx: BankTransaction,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[]
): MatchResult | null {
  const txText = [
    tx.counterparty_name,
    tx.description,
    tx.counterparty_account,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!txText || txText.length < 3) return null

  // Match expenses against documents
  if (tx.amount < 0) {
    for (const doc of documents) {
      const docText = [doc.supplier_name, doc.supplier_ico]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!docText) continue

      if (fuzzyContains(txText, docText)) {
        return { document_id: doc.id, confidence: 0.40, method: 'fuzzy' }
      }
    }
  }

  // Match income against invoices
  if (tx.amount > 0) {
    for (const inv of invoices) {
      const partnerName = inv.partner?.name || inv.partner_name || ''
      const partnerIco = inv.partner?.ico || ''
      const invText = [partnerName, partnerIco].filter(Boolean).join(' ').toLowerCase()
      if (!invText) continue

      if (fuzzyContains(txText, invText)) {
        return { invoice_id: inv.id, confidence: 0.40, method: 'fuzzy' }
      }
    }
  }

  return null
}

function fuzzyContains(haystack: string, needle: string): boolean {
  // Simple word-based matching: if 2+ words from needle appear in haystack
  const needleWords = needle
    .split(/\s+/)
    .filter(w => w.length > 2) // skip short words
  if (needleWords.length === 0) return false

  let matches = 0
  for (const word of needleWords) {
    if (haystack.includes(word)) matches++
  }

  return matches >= Math.min(2, needleWords.length)
}

export function matchDohodaPayment(
  tx: BankTransaction,
  unmatchedVykazy: MatchableDohodaVykaz[]
): MatchResult | null {
  // Only match expense transactions (negative = outgoing payment to employee)
  if (tx.amount >= 0) return null
  const absAmount = Math.abs(tx.amount)
  const txDate = new Date(tx.transaction_date)

  for (const vykaz of unmatchedVykazy) {
    // Amount must match within 1 CZK tolerance
    if (Math.abs(vykaz.cista_mzda - absAmount) > 1) continue

    // Check if tx date is in the month after the vykaz period (typical payroll timing)
    const [year, month] = vykaz.period.split('-').map(Number)
    const periodEnd = new Date(year, month, 0) // last day of period month
    const paymentWindow = new Date(year, month + 1, 15) // up to 15th of month+2

    if (txDate < periodEnd || txDate > paymentWindow) continue

    // Strategy 1: amount + counterparty name match
    if (vykaz.employee_name && tx.counterparty_name) {
      const empWords = vykaz.employee_name.toLowerCase().split(/\s+/)
      const txName = tx.counterparty_name.toLowerCase()
      const nameMatch = empWords.filter(w => w.length > 2).some(w => txName.includes(w))

      if (nameMatch) {
        return { dohoda_mesic_id: vykaz.id, confidence: 0.85, method: 'dohoda_amount_name' }
      }
    }

    // Strategy 2: amount only (lower confidence)
    return { dohoda_mesic_id: vykaz.id, confidence: 0.60, method: 'dohoda_amount' }
  }

  return null
}

export function autoMatchTransaction(
  tx: BankTransaction,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[],
  dohodaVykazy?: MatchableDohodaVykaz[]
): MatchResult | null {
  // Try strategies in order of confidence
  return (
    matchByVariableSymbol(tx, documents, invoices) ||
    matchByAmountDate(tx, documents, invoices) ||
    (dohodaVykazy ? matchDohodaPayment(tx, dohodaVykazy) : null) ||
    matchFuzzy(tx, documents, invoices)
  )
}

/**
 * Calculate tax impact of an unmatched expense transaction.
 * Returns how much tax/VAT the client is "losing" by not having the document.
 */
export function calculateTaxImpact(
  amount: number,
  legalForm: string,
  vatPayer: boolean
): { tax: number; vat: number } {
  const absAmount = Math.abs(amount)

  // Only expenses (negative amounts) have tax impact from missing docs
  if (amount >= 0) return { tax: 0, vat: 0 }

  // Income tax rates
  let taxRate: number
  if (legalForm === 's.r.o.' || legalForm === 'sro') {
    taxRate = 0.21 // Corporate income tax 21%
  } else {
    taxRate = 0.15 // Personal income tax 15% (OSVC)
  }

  // Tax impact: lost deduction from not having the expense document
  const tax = Math.round(absAmount * taxRate * 100) / 100

  // VAT impact: lost VAT deduction (only for VAT payers)
  let vat = 0
  if (vatPayer) {
    // Assume 21% VAT is included in the amount
    const vatBase = absAmount / 1.21
    vat = Math.round((absAmount - vatBase) * 100) / 100
  }

  return { tax, vat }
}
