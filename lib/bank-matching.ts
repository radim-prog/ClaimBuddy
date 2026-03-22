/**
 * Bank transaction matching engine
 * Matches bank transactions with documents and invoices using multiple strategies:
 * 1. Variable symbol match (confidence 0.95)
 * 2. Amount + date match (confidence 0.70)
 * 3. Fuzzy match by name/description (confidence 0.40)
 *
 * V2 additions:
 * 4. Periodic pattern match (confidence 0.80-0.90)
 * 5. Group match / partial payments (confidence 0.75)
 * 6. Auto-categorization fallback (keyword heuristics)
 */

import type {
  MatchMethod,
  MatchResultV2,
  PeriodicPattern,
  TransactionCategory,
  NON_TAXABLE_CATEGORIES as NonTaxableType,
} from '@/lib/types/bank-matching'
import { NON_TAXABLE_CATEGORIES } from '@/lib/types/bank-matching'

export type MatchableDocument = {
  id: string
  variable_symbol?: string | null
  total_with_vat?: number | null
  total_amount?: number | null
  date_issued?: string | null
  date_tax?: string | null
  supplier_name?: string | null
  supplier_ico?: string | null
}

export type MatchableInvoice = {
  id: string
  variable_symbol?: string | null
  total_with_vat?: number | null
  issue_date?: string | null
  partner?: { name?: string; ico?: string } | null
  partner_name?: string | null
}

export type BankTransactionInput = {
  id: string
  amount: number
  variable_symbol?: string | null
  counterparty_name?: string | null
  counterparty_account?: string | null
  transaction_date: string
  description?: string | null
  category?: string | null
  is_recurring?: boolean
  periodic_pattern_id?: string | null
}

// Legacy alias for backward compatibility
type BankTransaction = BankTransactionInput

export type MatchableDohodaVykaz = {
  id: string
  cista_mzda: number
  period: string
  employee_name?: string // "Jan Novák"
}

// Legacy MatchResult (V1 compatibility)
export type MatchResult = {
  document_id?: string
  invoice_id?: string
  dohoda_mesic_id?: string
  confidence: number
  method: MatchMethod
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

  // Income tax rates — normalize legal_form (DB stores various formats)
  const normalizedForm = (legalForm || '').toLowerCase().replace(/[.\s]/g, '')
  let taxRate: number
  if (normalizedForm === 'sro' || normalizedForm.includes('sro')) {
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

// ============================================================
// V2 MATCHING ENGINE
// ============================================================

/**
 * Match transaction against known periodic patterns.
 * Higher confidence if counterparty_account matches (0.90) vs name-only (0.80).
 */
export function matchByPeriodicPattern(
  tx: BankTransactionInput,
  patterns: PeriodicPattern[]
): MatchResultV2 | null {
  if (!patterns.length) return null

  const txDate = new Date(tx.transaction_date)

  for (const pattern of patterns) {
    if (!pattern.is_active) continue

    // Check amount range
    if (pattern.amount_min != null && pattern.amount_max != null) {
      const absAmount = Math.abs(tx.amount)
      if (absAmount < pattern.amount_min * 0.9 || absAmount > pattern.amount_max * 1.1) continue
    }

    // Check expected date window
    if (pattern.next_expected_date) {
      const expected = new Date(pattern.next_expected_date)
      const diffDays = Math.abs(
        (txDate.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays > (pattern.tolerance_days || 5)) continue
    }

    // Account match → high confidence
    if (pattern.counterparty_account && tx.counterparty_account) {
      const patternAcc = pattern.counterparty_account.replace(/\s/g, '')
      const txAcc = tx.counterparty_account.replace(/\s/g, '')
      if (patternAcc === txAcc) {
        return {
          confidence: 0.90,
          method: 'periodic_pattern',
          suggested_category: pattern.category as TransactionCategory | undefined,
        }
      }
    }

    // VS match
    if (pattern.variable_symbol && tx.variable_symbol) {
      const patternVs = pattern.variable_symbol.replace(/\D/g, '')
      const txVs = tx.variable_symbol.replace(/\D/g, '')
      if (patternVs && txVs && patternVs === txVs) {
        return {
          confidence: 0.90,
          method: 'periodic_pattern',
          suggested_category: pattern.category as TransactionCategory | undefined,
        }
      }
    }

    // Name match → moderate confidence
    if (pattern.counterparty_name && tx.counterparty_name) {
      const patternName = pattern.counterparty_name.toLowerCase()
      const txName = tx.counterparty_name.toLowerCase()
      if (txName.includes(patternName) || patternName.includes(txName)) {
        return {
          confidence: 0.80,
          method: 'periodic_pattern',
          suggested_category: pattern.category as TransactionCategory | undefined,
        }
      }
    }
  }

  return null
}

/**
 * Group match: find a subset of documents/invoices whose amounts sum to tx amount.
 * Greedy subset-sum, max 5 items. For partial payments / split payments.
 */
export function matchByGroup(
  tx: BankTransactionInput,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[]
): MatchResultV2 | null {
  const absAmount = Math.abs(tx.amount)
  if (absAmount < 1) return null

  const tolerance = 1 // 1 CZK tolerance

  // Collect candidate items with amounts
  const candidates: { id: string; amount: number; type: 'document' | 'invoice' }[] = []

  if (tx.amount < 0) {
    // Expense → match documents
    for (const doc of documents) {
      const docAmount = Math.abs(doc.total_with_vat ?? doc.total_amount ?? 0)
      if (docAmount > 0 && docAmount <= absAmount) {
        candidates.push({ id: doc.id, amount: docAmount, type: 'document' })
      }
    }
  } else {
    // Income → match invoices
    for (const inv of invoices) {
      const invAmount = Math.abs(inv.total_with_vat ?? 0)
      if (invAmount > 0 && invAmount <= absAmount) {
        candidates.push({ id: inv.id, amount: invAmount, type: 'invoice' })
      }
    }
  }

  if (candidates.length < 2) return null

  // Sort by amount descending (greedy approach)
  candidates.sort((a, b) => b.amount - a.amount)

  // Greedy subset-sum: take items that fit, max 5
  const selected: typeof candidates = []
  let remaining = absAmount

  for (const c of candidates) {
    if (selected.length >= 5) break
    if (c.amount <= remaining + tolerance) {
      selected.push(c)
      remaining -= c.amount
    }
    if (Math.abs(remaining) <= tolerance) break
  }

  // Accept only if we matched at least 2 items and total is within tolerance
  if (selected.length >= 2 && Math.abs(remaining) <= tolerance) {
    const firstItem = selected[0]
    return {
      [firstItem.type === 'document' ? 'document_id' : 'invoice_id']: firstItem.id,
      confidence: 0.75,
      method: 'split_payment',
      match_group_id: undefined, // caller creates group in DB
    }
  }

  return null
}

/**
 * Convert a full match into a partial match when amounts differ significantly.
 * Only applies to VS-matched items where payment covers >= 30% of doc amount.
 */
export function convertToPartialMatch(
  tx: BankTransactionInput,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[]
): MatchResultV2 | null {
  if (!tx.variable_symbol) return null

  const vs = tx.variable_symbol.replace(/\D/g, '')
  if (!vs) return null

  const absAmount = Math.abs(tx.amount)
  const MIN_RATIO = 0.30 // at least 30% of document amount

  // Check documents
  if (tx.amount < 0) {
    for (const doc of documents) {
      const docVs = doc.variable_symbol?.replace(/\D/g, '')
      if (!docVs || docVs !== vs) continue

      const docAmount = Math.abs(doc.total_with_vat ?? doc.total_amount ?? 0)
      if (docAmount <= 0) continue

      const ratio = absAmount / docAmount
      // Skip if it's a full match (handled by matchByVariableSymbol)
      if (ratio >= 0.99 && ratio <= 1.01) continue

      if (ratio >= MIN_RATIO && ratio < 0.99) {
        return {
          document_id: doc.id,
          confidence: 0.85,
          method: 'partial_payment',
          partial_amount: absAmount,
        }
      }
    }
  }

  // Check invoices
  if (tx.amount > 0) {
    for (const inv of invoices) {
      const invVs = inv.variable_symbol?.replace(/\D/g, '')
      if (!invVs || invVs !== vs) continue

      const invAmount = Math.abs(inv.total_with_vat ?? 0)
      if (invAmount <= 0) continue

      const ratio = absAmount / invAmount
      if (ratio >= 0.99 && ratio <= 1.01) continue

      if (ratio >= MIN_RATIO && ratio < 0.99) {
        return {
          invoice_id: inv.id,
          confidence: 0.85,
          method: 'partial_payment',
          partial_amount: absAmount,
        }
      }
    }
  }

  return null
}

// Keyword map for auto-categorization heuristics
const CATEGORY_KEYWORDS: [RegExp, TransactionCategory][] = [
  // Non-taxable / special
  [/\b(úvěr|splátka|hypot[eé]|leasing)\b/i, 'loan_repayment'],
  [/\b(dph|daň z přidané)\b/i, 'vat_payment'],
  [/\b(daň z příjm|dppo|dpfo|finanční úřad|fú)\b/i, 'tax_payment'],
  [/\b(čssz|ossz|sociální poj|sociální zabezp)\b/i, 'social_insurance_payment'],
  [/\b(vzp|ozp|čpzp|rbp|zdravotní poj|zp \d)\b/i, 'health_insurance_payment'],
  [/\b(vlastní (účet|převod)|interní převod|meziúčet)\b/i, 'internal_transfer'],
  [/\b(osobní|privátní|soukrom)\b/i, 'private_transfer'],
  // Expense categories
  [/\b(plyn|elektři|čez|eon|innogy|e\.on|prémium energy)\b/i, 'expense_energy'],
  [/\b(nájem|rent|pronájem)\b/i, 'expense_rent'],
  [/\b(t-mobile|o2|vodafone|internet|telef)\b/i, 'expense_phone_internet'],
  [/\b(pojist|allianz|generali|kooperativa|uniqa|čpp)\b/i, 'expense_insurance'],
  [/\b(mzd[ay]|výplat|plat\b)/i, 'expense_salary'],
  [/\b(phm|nafta|benzín|čerpací|shell|mol|orlen|tank)\b/i, 'expense_transport'],
  // Income categories
  [/\b(úrok\w*)\b/i, 'income_interest'],
]

/**
 * Auto-categorize a transaction based on description/counterparty keywords.
 * Returns a suggested category or null if no match.
 */
export function autoCategorizeFallback(
  tx: BankTransactionInput
): TransactionCategory | null {
  const text = [tx.counterparty_name, tx.description]
    .filter(Boolean)
    .join(' ')

  if (!text || text.length < 2) return null

  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category
  }

  return null
}

/**
 * V2 matching orchestrator — 7-step pipeline:
 * 1. Variable symbol exact match
 * 2. Partial payment (VS match, different amount)
 * 3. Amount + date match
 * 4. Periodic pattern match
 * 5. Dohoda payment match
 * 6. Group / split match
 * 7. Fuzzy name match
 *
 * Falls back to auto-categorization if no match found.
 * Preserves backward compatibility — call autoMatchTransaction() for V1 behavior.
 */
export function autoMatchTransactionV2(
  tx: BankTransactionInput,
  documents: MatchableDocument[],
  invoices: MatchableInvoice[],
  opts?: {
    dohodaVykazy?: MatchableDohodaVykaz[]
    patterns?: PeriodicPattern[]
  }
): MatchResultV2 | null {
  // 1. Variable symbol exact match (highest confidence)
  const vsMatch = matchByVariableSymbol(tx, documents, invoices)
  if (vsMatch) return { ...vsMatch, method: vsMatch.method }

  // 2. Partial payment (VS match, amount differs)
  const partialMatch = convertToPartialMatch(tx, documents, invoices)
  if (partialMatch) return partialMatch

  // 3. Amount + date match
  const amountMatch = matchByAmountDate(tx, documents, invoices)
  if (amountMatch) return { ...amountMatch, method: amountMatch.method }

  // 4. Periodic pattern match
  if (opts?.patterns?.length) {
    const patternMatch = matchByPeriodicPattern(tx, opts.patterns)
    if (patternMatch) return patternMatch
  }

  // 5. Dohoda payment match
  if (opts?.dohodaVykazy?.length) {
    const dohodaMatch = matchDohodaPayment(tx, opts.dohodaVykazy)
    if (dohodaMatch) return { ...dohodaMatch, method: dohodaMatch.method }
  }

  // 6. Group / split match (2+ items summing to tx amount)
  const groupMatch = matchByGroup(tx, documents, invoices)
  if (groupMatch) return groupMatch

  // 7. Fuzzy name match (lowest confidence)
  const fuzzyMatch = matchFuzzy(tx, documents, invoices)
  if (fuzzyMatch) return { ...fuzzyMatch, method: fuzzyMatch.method }

  // No match — try auto-categorization as suggestion
  const category = autoCategorizeFallback(tx)
  if (category) {
    return {
      confidence: 0,
      method: 'fuzzy',
      suggested_category: category,
    }
  }

  return null
}

/**
 * Detect periodic patterns from a set of transactions.
 * Groups by counterparty_account or counterparty_name, then checks
 * if transactions occur at regular intervals with similar amounts.
 */
export function detectPeriodicPatterns(
  transactions: BankTransactionInput[],
  companyId: string
): Omit<PeriodicPattern, 'id' | 'created_at' | 'updated_at'>[] {
  if (transactions.length < 3) return []

  // Group by counterparty_account (preferred) or counterparty_name
  const groups = new Map<string, BankTransactionInput[]>()
  for (const tx of transactions) {
    const key = tx.counterparty_account?.replace(/\s/g, '') ||
                tx.counterparty_name?.toLowerCase() ||
                null
    if (!key) continue

    const existing = groups.get(key) || []
    existing.push(tx)
    groups.set(key, existing)
  }

  const patterns: Omit<PeriodicPattern, 'id' | 'created_at' | 'updated_at'>[] = []

  for (const [key, txs] of groups) {
    // Need at least 3 transactions to detect a pattern
    if (txs.length < 3) continue

    // Sort by date
    const sorted = [...txs].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )

    // Calculate intervals between consecutive transactions (in days)
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].transaction_date)
      const curr = new Date(sorted[i].transaction_date)
      intervals.push((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Determine frequency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    let frequency: PeriodicPattern['frequency'] = 'irregular'
    if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly'
    else if (avgInterval >= 85 && avgInterval <= 95) frequency = 'quarterly'
    else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'yearly'
    else continue // too irregular, skip

    // Check that intervals are consistent (stddev < 30% of mean)
    const variance = intervals.reduce((sum, i) => sum + (i - avgInterval) ** 2, 0) / intervals.length
    const stddev = Math.sqrt(variance)
    if (stddev / avgInterval > 0.3) continue

    // Calculate amount stats
    const amounts = sorted.map(t => Math.abs(t.amount))
    const amountAvg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const amountMin = Math.min(...amounts)
    const amountMax = Math.max(...amounts)

    // Compute next expected date
    const lastDate = new Date(sorted[sorted.length - 1].transaction_date)
    const nextDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000)

    // Determine counterparty name (most common)
    const nameFreq = new Map<string, number>()
    for (const t of sorted) {
      const name = t.counterparty_name || ''
      nameFreq.set(name, (nameFreq.get(name) || 0) + 1)
    }
    const mostCommonName = [...nameFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || key

    patterns.push({
      company_id: companyId,
      pattern_name: `${mostCommonName} — ${frequency === 'monthly' ? 'měsíční' : frequency === 'quarterly' ? 'kvartální' : 'roční'}`,
      counterparty_name: mostCommonName || null,
      counterparty_account: sorted[0].counterparty_account || null,
      variable_symbol: sorted[0].variable_symbol || null,
      amount_avg: Math.round(amountAvg * 100) / 100,
      amount_min: Math.round(amountMin * 100) / 100,
      amount_max: Math.round(amountMax * 100) / 100,
      frequency,
      category: autoCategorizeFallback(sorted[0]) || null,
      next_expected_date: nextDate.toISOString().substring(0, 10),
      tolerance_days: Math.max(3, Math.round(stddev)),
      occurrence_count: sorted.length,
      last_occurrence_date: sorted[sorted.length - 1].transaction_date,
      is_active: true,
    })
  }

  return patterns
}
