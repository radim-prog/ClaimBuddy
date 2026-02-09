import { supabaseAdmin } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * BankTransaction - inline type matching the shape from bank-statement-parser.
 * Kept inline to avoid circular dependency issues when the parser exports
 * a slightly different shape (e.g. variable_symbol vs variableSymbol).
 */
export interface BankTransaction {
  id?: string
  date: string              // YYYY-MM-DD
  amount: number            // Absolute value
  currency?: string
  variable_symbol?: string
  variableSymbol?: string   // Alias used by some parser versions
  specific_symbol?: string
  counter_account?: string
  counter_bank_code?: string
  counterpartyName?: string // Alias used by some parser versions
  supplier_name?: string
  message?: string
  description?: string
  type?: 'debit' | 'credit'
}

/**
 * Invoice - a receivable or payable document to match against.
 */
export interface Invoice {
  id: string
  variable_symbol?: string
  amount: number
  supplier_name?: string
  date_issued?: string
  date_due?: string
}

/**
 * Result of matching a single transaction against the invoice pool.
 */
export type MatchResult = {
  transaction_id?: string
  invoice_id: string | null
  match_type: 'MATCH' | 'PARTIAL' | 'NO_MATCH'
  score: number
  details: string[]
  amount_diff?: number
}

/**
 * Configurable weights and thresholds for the scoring engine.
 * All fields have sensible defaults - callers may override individual values.
 */
export type MatchingConfig = {
  vs_weight: number            // default 100
  amount_exact_weight: number  // default 50
  amount_close_weight: number  // default 30 (within 5%)
  supplier_fuzzy_weight: number // default 40
  date_proximity_weight: number // default 20 (within 31 days)
  match_threshold: number      // default 100
  partial_threshold: number    // default 60
}

// ---------------------------------------------------------------------------
// Legacy types - kept for backward compatibility with report-generator.ts
// ---------------------------------------------------------------------------

/** @deprecated Use MatchResult instead */
export type LegacyMatchResult = 'match' | 'partial' | 'no_match'

export interface TransactionMatch {
  transaction_date: string
  transaction_amount: number
  transaction_currency: string
  transaction_variable_symbol: string | null
  transaction_counterparty: string | null
  transaction_description: string | null
  matched_document_id: string | null
  matched_invoice_id: string | null
  match_result: LegacyMatchResult
  score: { total: number; breakdown: Record<string, number> }
  confidence: number
}

export interface MatchingSummary {
  total_transactions: number
  matched_count: number
  partial_count: number
  unmatched_count: number
  total_amount: number
  matched_amount: number
  unmatched_amount: number
  matches: TransactionMatch[]
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MatchingConfig = {
  vs_weight: 100,
  amount_exact_weight: 50,
  amount_close_weight: 30,
  supplier_fuzzy_weight: 40,
  date_proximity_weight: 20,
  match_threshold: 100,
  partial_threshold: 60,
}

// ---------------------------------------------------------------------------
// Czech character normalization
// ---------------------------------------------------------------------------

/**
 * Maps Czech diacritic characters to their ASCII equivalents.
 * Used for fuzzy string comparison where diacritics should not
 * prevent a match (e.g. "Novak" vs "Novak").
 */
const CZECH_CHAR_MAP: Record<string, string> = {
  '\u00e1': 'a', // a
  '\u010d': 'c', // c
  '\u010f': 'd', // d
  '\u00e9': 'e', // e
  '\u011b': 'e', // e
  '\u00ed': 'i', // i
  '\u0148': 'n', // n
  '\u00f3': 'o', // o
  '\u0159': 'r', // r
  '\u0161': 's', // s
  '\u0165': 't', // t
  '\u00fa': 'u', // u
  '\u016f': 'u', // u
  '\u00fd': 'y', // y
  '\u017e': 'z', // z
  // Uppercase variants (after toLowerCase they become the above,
  // but included for safety when normalizeCzech is called on mixed case)
  '\u00c1': 'a', // A
  '\u010c': 'c', // C
  '\u010e': 'd', // D
  '\u00c9': 'e', // E
  '\u011a': 'e', // E
  '\u00cd': 'i', // I
  '\u0147': 'n', // N
  '\u00d3': 'o', // O
  '\u0158': 'r', // R
  '\u0160': 's', // S
  '\u0164': 't', // T
  '\u00da': 'u', // U
  '\u016e': 'u', // U
  '\u00dd': 'y', // Y
  '\u017d': 'z', // Z
}

function normalizeCzech(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => CZECH_CHAR_MAP[ch] ?? ch)
    .join('')
}

// ---------------------------------------------------------------------------
// Fuzzy string matching
// ---------------------------------------------------------------------------

/**
 * Compute the Levenshtein edit distance between two strings.
 * Uses a single-row optimized DP approach (O(min(m,n)) memory).
 */
function levenshteinDistance(a: string, b: string): number {
  // Ensure a is the shorter string for memory optimization
  if (a.length > b.length) {
    const tmp = a
    a = b
    b = tmp
  }

  const aLen = a.length
  const bLen = b.length

  // Early exits
  if (aLen === 0) return bLen
  if (bLen === 0) return aLen

  // Single-row DP
  const prevRow = new Array(aLen + 1)
  for (let i = 0; i <= aLen; i++) prevRow[i] = i

  for (let j = 1; j <= bLen; j++) {
    let prev = prevRow[0]
    prevRow[0] = j

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const val = Math.min(
        prevRow[i] + 1,       // deletion
        prevRow[i - 1] + 1,   // insertion
        prev + cost            // substitution
      )
      prev = prevRow[i]
      prevRow[i] = val
    }
  }

  return prevRow[aLen]
}

/**
 * Compare two strings using a combination of token overlap (Jaccard) and
 * Levenshtein similarity. Returns a value between 0.0 and 1.0.
 *
 * The algorithm:
 *  1. Normalize Czech diacritics and lowercase both strings.
 *  2. Compute character-level Levenshtein similarity.
 *  3. Tokenize and compute Jaccard-like token overlap.
 *  4. Return the maximum of the two scores.
 *
 * This dual approach handles both:
 *  - Minor typos in otherwise identical strings (Levenshtein)
 *  - Partial name matches like "Firma ABC" vs "Firma ABC s.r.o." (Jaccard)
 */
export function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0

  const normA = normalizeCzech(a.trim())
  const normB = normalizeCzech(b.trim())

  if (normA.length === 0 || normB.length === 0) return 0
  if (normA === normB) return 1.0

  // --- Levenshtein similarity ---
  const maxLen = Math.max(normA.length, normB.length)
  const editDist = levenshteinDistance(normA, normB)
  const levenshteinSimilarity = 1 - editDist / maxLen

  // --- Token-based Jaccard overlap ---
  const tokenize = (s: string): string[] => {
    return s.split(/[\s.,;:\/\\()\-_]+/).filter((t) => t.length >= 2)
  }

  const tokensA = tokenize(normA)
  const tokensB = tokenize(normB)

  let jaccardSimilarity = 0
  if (tokensA.length > 0 && tokensB.length > 0) {
    const setB = new Set(tokensB)
    let intersectionSize = 0
    for (let i = 0; i < tokensA.length; i++) {
      if (setB.has(tokensA[i])) {
        intersectionSize++
      }
    }
    // Use the smaller set as denominator to allow partial matching
    // (e.g. "Firma ABC" matching "Firma ABC s.r.o.")
    const denominator = Math.min(tokensA.length, tokensB.length)
    jaccardSimilarity = denominator === 0 ? 0 : intersectionSize / denominator
  }

  return Math.max(levenshteinSimilarity, jaccardSimilarity)
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a variable symbol by stripping leading zeros and whitespace.
 * Czech variable symbols are numeric strings that banks may zero-pad.
 */
function normalizeVS(vs: string | null | undefined): string {
  if (!vs) return ''
  return vs.replace(/^0+/, '').trim()
}

/**
 * Resolve the variable symbol from a BankTransaction, handling both
 * possible field names (variable_symbol and variableSymbol).
 */
function resolveTransactionVS(tx: BankTransaction): string | undefined {
  return tx.variable_symbol ?? tx.variableSymbol
}

/**
 * Resolve the supplier/counterparty name from a BankTransaction,
 * handling the various field name conventions.
 */
function resolveTransactionSupplier(tx: BankTransaction): string | undefined {
  return tx.counterpartyName ?? tx.supplier_name
}

/**
 * Resolve the description from a BankTransaction.
 */
function resolveTransactionDescription(tx: BankTransaction): string | undefined {
  return tx.description ?? tx.message
}

// ---------------------------------------------------------------------------
// Core scoring engine
// ---------------------------------------------------------------------------

/**
 * Score a single transaction against a single invoice.
 * Returns detailed score breakdown with human-readable reasons.
 */
function scoreTransactionAgainstInvoice(
  tx: BankTransaction,
  invoice: Invoice,
  config: MatchingConfig
): { score: number; details: string[]; amountDiff: number | undefined } {
  let score = 0
  const details: string[] = []
  let amountDiff: number | undefined

  // 1. Variable symbol exact match
  const txVS = normalizeVS(resolveTransactionVS(tx))
  const invVS = normalizeVS(invoice.variable_symbol)

  if (txVS && invVS && txVS === invVS) {
    score += config.vs_weight
    details.push(`VS exact match: "${txVS}" [+${config.vs_weight}]`)
  } else if (txVS && invVS) {
    details.push(`VS mismatch: tx="${txVS}" vs inv="${invVS}"`)
  }

  // 2. Amount comparison
  const txAmount = Math.abs(tx.amount)
  const invAmount = Math.abs(invoice.amount)
  amountDiff = Math.round((txAmount - invAmount) * 100) / 100

  if (invAmount > 0) {
    const absDiff = Math.abs(txAmount - invAmount)
    const pctDiff = absDiff / invAmount

    if (absDiff < 0.01) {
      // Exact match (within rounding tolerance of 1 penny)
      score += config.amount_exact_weight
      details.push(
        `Amount exact match: ${txAmount.toFixed(2)} [+${config.amount_exact_weight}]`
      )
    } else if (pctDiff <= 0.05) {
      // Close match (within 5%)
      score += config.amount_close_weight
      details.push(
        `Amount close match: tx=${txAmount.toFixed(2)} vs inv=${invAmount.toFixed(2)} ` +
        `(diff ${(pctDiff * 100).toFixed(1)}%) [+${config.amount_close_weight}]`
      )
    } else {
      details.push(
        `Amount mismatch: tx=${txAmount.toFixed(2)} vs inv=${invAmount.toFixed(2)} ` +
        `(diff ${(pctDiff * 100).toFixed(1)}%)`
      )
    }
  }

  // 3. Supplier name fuzzy match
  const txSupplier = resolveTransactionSupplier(tx)
  const invSupplier = invoice.supplier_name

  if (txSupplier && invSupplier) {
    const similarity = fuzzyMatch(txSupplier, invSupplier)

    if (similarity >= 0.6) {
      score += config.supplier_fuzzy_weight
      details.push(
        `Supplier fuzzy match: "${txSupplier}" ~ "${invSupplier}" ` +
        `(${(similarity * 100).toFixed(0)}%) [+${config.supplier_fuzzy_weight}]`
      )
    } else if (similarity > 0) {
      details.push(
        `Supplier weak match: "${txSupplier}" ~ "${invSupplier}" ` +
        `(${(similarity * 100).toFixed(0)}% < 60% threshold)`
      )
    }
  }

  // 4. Date proximity (within 31 days)
  const txDate = tx.date ? new Date(tx.date) : null
  // Compare against both issue date and due date, use the closer one
  const invIssueDate = invoice.date_issued ? new Date(invoice.date_issued) : null
  const invDueDate = invoice.date_due ? new Date(invoice.date_due) : null

  if (txDate && !isNaN(txDate.getTime())) {
    let closestDays = Infinity
    let comparedDateLabel = ''

    if (invIssueDate && !isNaN(invIssueDate.getTime())) {
      const diffDays = Math.abs(txDate.getTime() - invIssueDate.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < closestDays) {
        closestDays = diffDays
        comparedDateLabel = `issue date ${invoice.date_issued}`
      }
    }

    if (invDueDate && !isNaN(invDueDate.getTime())) {
      const diffDays = Math.abs(txDate.getTime() - invDueDate.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < closestDays) {
        closestDays = diffDays
        comparedDateLabel = `due date ${invoice.date_due}`
      }
    }

    if (closestDays <= 31) {
      score += config.date_proximity_weight
      details.push(
        `Date proximity: tx ${tx.date} within ${Math.round(closestDays)}d of ${comparedDateLabel} [+${config.date_proximity_weight}]`
      )
    } else if (closestDays < Infinity) {
      details.push(
        `Date too far: tx ${tx.date} is ${Math.round(closestDays)}d from ${comparedDateLabel} (>31d threshold)`
      )
    }
  }

  return { score, details, amountDiff }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Match a single bank transaction against a list of invoices.
 * Returns the best match or NO_MATCH if no invoice scores above the
 * partial threshold.
 *
 * @param tx - The bank transaction to match
 * @param invoices - Pool of invoices to score against
 * @param configOverride - Optional partial config to override defaults
 */
export function matchTransaction(
  tx: BankTransaction,
  invoices: Invoice[],
  configOverride?: Partial<MatchingConfig>
): MatchResult {
  const config: MatchingConfig = { ...DEFAULT_CONFIG, ...configOverride }

  if (invoices.length === 0) {
    return {
      transaction_id: tx.id,
      invoice_id: null,
      match_type: 'NO_MATCH',
      score: 0,
      details: ['No invoices available for matching'],
      amount_diff: undefined,
    }
  }

  let bestResult: MatchResult = {
    transaction_id: tx.id,
    invoice_id: null,
    match_type: 'NO_MATCH',
    score: 0,
    details: ['No invoice scored above threshold'],
    amount_diff: undefined,
  }

  for (const invoice of invoices) {
    const { score, details, amountDiff } = scoreTransactionAgainstInvoice(tx, invoice, config)

    if (score > bestResult.score) {
      let matchType: 'MATCH' | 'PARTIAL' | 'NO_MATCH'

      if (score >= config.match_threshold) {
        matchType = 'MATCH'
      } else if (score >= config.partial_threshold) {
        matchType = 'PARTIAL'
      } else {
        matchType = 'NO_MATCH'
      }

      bestResult = {
        transaction_id: tx.id,
        invoice_id: matchType !== 'NO_MATCH' ? invoice.id : null,
        match_type: matchType,
        score,
        details,
        amount_diff: amountDiff,
      }
    }
  }

  return bestResult
}

/**
 * Match all transactions against all invoices in batch.
 * Each transaction is independently matched against the full invoice pool.
 *
 * Note: This is a greedy algorithm where each transaction picks its best
 * invoice independently. For scenarios where one invoice must not be matched
 * to multiple transactions, post-processing deduplication is recommended.
 *
 * @param transactions - Array of bank transactions
 * @param invoices - Pool of invoices to score against
 * @param configOverride - Optional partial config to override defaults
 */
export function matchBatch(
  transactions: BankTransaction[],
  invoices: Invoice[],
  configOverride?: Partial<MatchingConfig>
): MatchResult[] {
  return transactions.map((tx) => matchTransaction(tx, invoices, configOverride))
}

// ---------------------------------------------------------------------------
// Persistence - save to Supabase
// ---------------------------------------------------------------------------

/**
 * Persist matching results to the `payment_matches` table in Supabase.
 * Existing rows for the same company + period are deleted first so we
 * always store a clean snapshot (idempotent upsert strategy).
 *
 * The transaction_data column stores the full MatchResult as JSONB,
 * while key fields are denormalized into dedicated columns for querying.
 *
 * @param matches - Array of MatchResult from matchBatch or matchTransaction
 * @param companyId - UUID of the company
 * @param period - Period identifier, e.g. "2025-01" or "2025-Q1"
 */
export async function saveMatches(
  matches: MatchResult[],
  companyId: string,
  period: string
): Promise<void> {
  // Delete previous matches for this company/period (idempotent)
  const { error: deleteError } = await supabaseAdmin
    .from('payment_matches')
    .delete()
    .eq('company_id', companyId)
    .eq('period', period)

  if (deleteError) {
    throw new Error(`Failed to clear previous matches: ${deleteError.message}`)
  }

  if (matches.length === 0) return

  // Prepare rows for insertion
  const rows = matches.map((m) => ({
    company_id: companyId,
    period,
    transaction_data: {
      transaction_id: m.transaction_id,
      score: m.score,
      amount_diff: m.amount_diff,
    },
    invoice_id: m.invoice_id,
    match_type: m.match_type,
    score: m.score,
    details: m.details,
  }))

  // Insert in batches of 500 to stay within Supabase payload limits
  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error: insertError } = await supabaseAdmin
      .from('payment_matches')
      .insert(batch)

    if (insertError) {
      throw new Error(
        `Failed to insert matches batch starting at index ${i}: ${insertError.message}`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Persistence - load from Supabase
// ---------------------------------------------------------------------------

/**
 * Retrieve all stored matches for a company and period.
 *
 * @param companyId - UUID of the company
 * @param period - Period identifier, e.g. "2025-01" or "2025-Q1"
 * @returns Array of MatchResult reconstructed from DB rows
 */
export async function getMatches(
  companyId: string,
  period: string
): Promise<MatchResult[]> {
  const { data, error } = await supabaseAdmin
    .from('payment_matches')
    .select('*')
    .eq('company_id', companyId)
    .eq('period', period)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch matches: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  return data.map((row: any) => ({
    transaction_id: row.transaction_data?.transaction_id ?? undefined,
    invoice_id: row.invoice_id ?? null,
    match_type: row.match_type as 'MATCH' | 'PARTIAL' | 'NO_MATCH',
    score: row.score ?? 0,
    details: Array.isArray(row.details) ? row.details : [],
    amount_diff: row.transaction_data?.amount_diff ?? undefined,
  }))
}

// ---------------------------------------------------------------------------
// Legacy compatibility bridge
// ---------------------------------------------------------------------------

/**
 * Convert the new MatchResult[] + transactions into the legacy MatchingSummary
 * format that report-generator.ts expects.
 *
 * @param transactions - Original bank transactions
 * @param results - MatchResult array from matchBatch
 */
export function toMatchingSummary(
  transactions: BankTransaction[],
  results: MatchResult[]
): MatchingSummary {
  const matches: TransactionMatch[] = transactions.map((tx, i) => {
    const result = results[i] ?? {
      invoice_id: null,
      match_type: 'NO_MATCH' as const,
      score: 0,
      details: [],
    }

    const legacyResult: LegacyMatchResult =
      result.match_type === 'MATCH' ? 'match' :
      result.match_type === 'PARTIAL' ? 'partial' : 'no_match'

    // Max theoretical score = 100 (VS) + 50 (amount exact) + 40 (supplier) + 20 (date) = 210
    const maxScore = 210
    const confidence = Math.min(100, Math.round((result.score / maxScore) * 100))

    return {
      transaction_date: tx.date,
      transaction_amount: tx.amount * (tx.type === 'debit' ? -1 : 1),
      transaction_currency: tx.currency ?? 'CZK',
      transaction_variable_symbol: resolveTransactionVS(tx) ?? null,
      transaction_counterparty: resolveTransactionSupplier(tx) ?? null,
      transaction_description: resolveTransactionDescription(tx) ?? null,
      matched_document_id: null,
      matched_invoice_id: result.invoice_id,
      match_result: legacyResult,
      score: {
        total: result.score,
        breakdown: detailsToBreakdown(result.details),
      },
      confidence,
    }
  })

  let matchedCount = 0
  let partialCount = 0
  let unmatchedCount = 0
  let totalAmount = 0
  let matchedAmount = 0
  let unmatchedAmount = 0

  for (const m of matches) {
    const absAmount = Math.abs(m.transaction_amount)
    totalAmount += absAmount

    switch (m.match_result) {
      case 'match':
        matchedCount++
        matchedAmount += absAmount
        break
      case 'partial':
        partialCount++
        unmatchedAmount += absAmount
        break
      case 'no_match':
        unmatchedCount++
        unmatchedAmount += absAmount
        break
    }
  }

  return {
    total_transactions: transactions.length,
    matched_count: matchedCount,
    partial_count: partialCount,
    unmatched_count: unmatchedCount,
    total_amount: totalAmount,
    matched_amount: matchedAmount,
    unmatched_amount: unmatchedAmount,
    matches,
  }
}

/**
 * Parse the human-readable details array back into a numeric breakdown.
 * This is a best-effort extraction for legacy compatibility.
 */
function detailsToBreakdown(details: string[]): Record<string, number> {
  const breakdown: Record<string, number> = {
    variable_symbol: 0,
    amount_exact: 0,
    amount_close: 0,
    supplier_fuzzy: 0,
    date_tolerance: 0,
  }

  for (const detail of details) {
    const pointsMatch = detail.match(/\[\+(\d+)\]/)
    if (!pointsMatch) continue
    const points = parseInt(pointsMatch[1], 10)

    if (detail.startsWith('VS ')) {
      breakdown.variable_symbol = points
    } else if (detail.startsWith('Amount exact')) {
      breakdown.amount_exact = points
    } else if (detail.startsWith('Amount close')) {
      breakdown.amount_close = points
    } else if (detail.startsWith('Supplier')) {
      breakdown.supplier_fuzzy = points
    } else if (detail.startsWith('Date')) {
      breakdown.date_tolerance = points
    }
  }

  return breakdown
}
