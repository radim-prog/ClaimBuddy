/**
 * Monthly Financial Report Generator
 *
 * Generates comprehensive monthly financial reports for Czech companies.
 * Calculates the tax impact of missing documents (bank expenses without
 * matching invoices/receipts), because without a document the expense
 * cannot be claimed as a tax deduction.
 *
 * Tax impact calculation (conservative estimate for VAT-paying s.r.o.):
 *   base_amount = gross_amount / 1.21
 *   income_tax_loss = base_amount * 0.21
 *   vat_deduction_loss = base_amount * 0.21
 *   total_tax_impact = income_tax_loss + vat_deduction_loss
 *
 *   Example: 12,100 CZK expense without document
 *     base = 12,100 / 1.21 = 10,000
 *     income_tax_loss = 10,000 * 0.21 = 2,100
 *     vat_deduction_loss = 10,000 * 0.21 = 2,100
 *     total = 4,200 CZK additional tax burden
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================
// TYPES
// ============================================

export type FinancialReport = {
  company_id: string
  company_name: string
  period: string // 'YYYY-MM'
  generated_at: string

  income: {
    total: number
    paid: number // received payments
    unpaid: number // outstanding invoices
  }

  expenses: {
    total: number
    matched: number // with matching document
    unmatched: number // no document found
    non_deductible: number // fines, gifts etc.
    ignored: number // salaries, taxes, transfers
  }

  tax_impact: number // how much more client pays in taxes due to missing docs
  tax_impact_breakdown: {
    income_tax_loss: number // base * 0.21
    vat_deduction_loss: number // base * 0.21
  }

  top_missing: Array<{
    amount: number
    description: string
    date: string
    counterparty?: string
  }>

  summary_text: string // human-readable summary in Czech

  yoy_comparison?: {
    previous_period: string
    income_change_pct: number
    expense_change_pct: number
    tax_impact_change: number
  }
}

// ============================================
// TAX CONSTANTS
// ============================================

const VAT_RATE = 0.21
const VAT_DIVISOR = 1 + VAT_RATE // 1.21
const TAX_IMPACT_RATE = 0.21 // Conservative rate used for both income tax and VAT loss

const TOP_MISSING_LIMIT = 10

// ============================================
// INTERNAL TYPES
// ============================================

interface PaymentMatchRow {
  id: string
  company_id: string
  period: string
  transaction_date: string
  transaction_amount: number
  transaction_description: string | null
  transaction_counterparty: string | null
  match_result: 'match' | 'partial' | 'no_match'
  matched_document_id: string | null
  matched_invoice_id: string | null
  // Additional fields may be present but are not required here
  [key: string]: unknown
}

interface InvoiceRow {
  id: string
  company_id: string
  invoice_number: string
  total_with_vat: number
  status: string // 'paid', 'unpaid', 'overdue', etc.
  issue_date: string
  due_date: string | null
  partner_name: string | null
  [key: string]: unknown
}

interface CompanyRow {
  id: string
  name: string
  [key: string]: unknown
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate tax impact for a given gross amount of unmatched expenses.
 *
 * The gross amount includes VAT. We first extract the base (net) amount
 * by dividing by 1.21, then apply the 0.21 rate for both income tax loss
 * and lost VAT deduction.
 *
 * @param grossAmount - Total amount of expenses without matching documents
 * @returns Breakdown with income_tax_loss, vat_deduction_loss, and total
 */
function calculateTaxImpact(grossAmount: number): {
  income_tax_loss: number
  vat_deduction_loss: number
  total: number
} {
  if (grossAmount <= 0) {
    return { income_tax_loss: 0, vat_deduction_loss: 0, total: 0 }
  }

  const base = grossAmount / VAT_DIVISOR
  const income_tax_loss = Math.round(base * TAX_IMPACT_RATE * 100) / 100
  const vat_deduction_loss = Math.round(base * TAX_IMPACT_RATE * 100) / 100
  const total = Math.round((income_tax_loss + vat_deduction_loss) * 100) / 100

  return { income_tax_loss, vat_deduction_loss, total }
}

/**
 * Format a number as Czech currency (CZK) for display in summary text.
 */
function formatCZK(amount: number): string {
  return (
    new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + ' Kc'
  )
}

/**
 * Check if an error message indicates a missing table or permission issue
 * in Supabase / PostgreSQL.
 */
function isTableMissingError(message: string): boolean {
  return (
    message.includes('does not exist') ||
    message.includes('permission denied') ||
    message.includes('42P01') // PostgreSQL "undefined_table"
  )
}

/**
 * Compute the previous year's period string for year-over-year comparison.
 * E.g. '2025-03' -> '2024-03'
 */
function getPreviousYearPeriod(period: string): string {
  const [yearStr, month] = period.split('-')
  const previousYear = parseInt(yearStr, 10) - 1
  return `${previousYear}-${month}`
}

/**
 * Calculate percentage change between two values, guarding against division
 * by zero. Returns 0 when the previous value is 0.
 */
function percentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate a complete monthly financial report for a company.
 *
 * Fetches data from Supabase:
 *   - payment_matches table: matched/unmatched transactions
 *   - invoices table: issued invoices for income calculation
 *   - companies table: company name
 *
 * Calculates tax impact, builds top missing documents list, generates
 * Czech summary text, and optionally computes year-over-year comparison.
 *
 * @param companyId - UUID of the company
 * @param period - Period string in 'YYYY-MM' format
 * @returns Complete FinancialReport
 */
export async function generateReport(
  companyId: string,
  period: string
): Promise<FinancialReport> {
  // Fetch all required data in parallel
  const [companyResult, matchesResult, invoicesResult] = await Promise.all([
    supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single(),
    supabaseAdmin
      .from('payment_matches')
      .select('*')
      .eq('company_id', companyId)
      .eq('period', period)
      .order('transaction_amount', { ascending: true }),
    supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('company_id', companyId)
      .eq('period', period),
  ])

  // Extract company name (fallback to ID if not found)
  const company: CompanyRow | null = companyResult.data as CompanyRow | null
  const companyName = company?.name ?? `Firma ${companyId.slice(0, 8)}`

  // Process payment matches
  const matches: PaymentMatchRow[] =
    (matchesResult.data as PaymentMatchRow[] | null) ?? []
  const invoices: InvoiceRow[] =
    (invoicesResult.data as InvoiceRow[] | null) ?? []

  // --- Income calculation from invoices ---
  let incomePaid = 0
  let incomeUnpaid = 0

  for (const invoice of invoices) {
    const amount = Math.abs(invoice.total_with_vat)
    if (invoice.status === 'paid') {
      incomePaid += amount
    } else {
      incomeUnpaid += amount
    }
  }

  const incomeTotal = incomePaid + incomeUnpaid

  // --- Expense calculation from payment matches ---
  // Only negative amounts are expenses in bank transactions
  let expenseMatched = 0
  let expenseUnmatched = 0
  let expenseNonDeductible = 0
  let expenseIgnored = 0

  // Collect unmatched expenses for the "top missing" list
  const unmatchedExpenses: Array<{
    amount: number
    description: string
    date: string
    counterparty?: string
  }> = []

  for (const match of matches) {
    // Only process expense transactions (negative amounts)
    if (match.transaction_amount >= 0) continue

    const absAmount = Math.abs(match.transaction_amount)

    switch (match.match_result) {
      case 'match':
        expenseMatched += absAmount
        break

      case 'partial':
        // Partial matches still count as unmatched -- the document has not
        // been confirmed and therefore cannot be used for tax deduction.
        expenseUnmatched += absAmount
        unmatchedExpenses.push({
          amount: absAmount,
          description: match.transaction_description ?? 'Bez popisu',
          date: match.transaction_date,
          counterparty: match.transaction_counterparty ?? undefined,
        })
        break

      case 'no_match':
      default:
        expenseUnmatched += absAmount
        unmatchedExpenses.push({
          amount: absAmount,
          description: match.transaction_description ?? 'Bez popisu',
          date: match.transaction_date,
          counterparty: match.transaction_counterparty ?? undefined,
        })
        break
    }
  }

  const expenseTotal =
    expenseMatched + expenseUnmatched + expenseNonDeductible + expenseIgnored

  // --- Tax impact of missing documents ---
  const taxImpactResult = calculateTaxImpact(expenseUnmatched)

  // --- Top missing documents, sorted by amount descending ---
  const topMissing = unmatchedExpenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_MISSING_LIMIT)

  // --- Year-over-year comparison (optional) ---
  let yoyComparison: FinancialReport['yoy_comparison'] | undefined
  const previousPeriod = getPreviousYearPeriod(period)

  try {
    const previousReport = await loadReportFromDb(companyId, previousPeriod)

    if (previousReport) {
      yoyComparison = {
        previous_period: previousPeriod,
        income_change_pct: percentageChange(
          incomeTotal,
          previousReport.income.total
        ),
        expense_change_pct: percentageChange(
          expenseTotal,
          previousReport.expenses.total
        ),
        tax_impact_change: Math.round(
          (taxImpactResult.total - previousReport.tax_impact) * 100
        ) / 100,
      }
    }
  } catch {
    // Year-over-year is optional; if fetching fails we simply skip it.
  }

  // --- Build the report object ---
  const report: FinancialReport = {
    company_id: companyId,
    company_name: companyName,
    period,
    generated_at: new Date().toISOString(),

    income: {
      total: Math.round(incomeTotal * 100) / 100,
      paid: Math.round(incomePaid * 100) / 100,
      unpaid: Math.round(incomeUnpaid * 100) / 100,
    },

    expenses: {
      total: Math.round(expenseTotal * 100) / 100,
      matched: Math.round(expenseMatched * 100) / 100,
      unmatched: Math.round(expenseUnmatched * 100) / 100,
      non_deductible: Math.round(expenseNonDeductible * 100) / 100,
      ignored: Math.round(expenseIgnored * 100) / 100,
    },

    tax_impact: taxImpactResult.total,
    tax_impact_breakdown: {
      income_tax_loss: taxImpactResult.income_tax_loss,
      vat_deduction_loss: taxImpactResult.vat_deduction_loss,
    },

    top_missing: topMissing,

    summary_text: '', // Placeholder, generated below

    yoy_comparison: yoyComparison,
  }

  // Generate the Czech summary text
  report.summary_text = generateSummaryText(report)

  return report
}

// ============================================
// SUMMARY TEXT GENERATION
// ============================================

/**
 * Generate a human-readable summary in Czech language.
 *
 * Example output:
 *   "Za obdobi 2025-01 ma firma XY celkove prijmy 450 000 Kc a vydaje
 *    280 000 Kc. Z toho 35 000 Kc vydaju nema prirazeny doklad, coz
 *    znamena dodatecnou danovou zatez 12 150 Kc."
 *
 * @param report - The FinancialReport to summarize
 * @returns Czech language summary string
 */
export function generateSummaryText(report: FinancialReport): string {
  const lines: string[] = []

  // Opening line: period, company, income, expenses
  lines.push(
    `Za obdobi ${report.period} ma firma ${report.company_name} ` +
      `celkove prijmy ${formatCZK(report.income.total)} a vydaje ${formatCZK(report.expenses.total)}.`
  )

  // Income breakdown (paid vs unpaid)
  if (report.income.unpaid > 0) {
    lines.push(
      `Z prijmu je ${formatCZK(report.income.paid)} uhrazeno a ` +
        `${formatCZK(report.income.unpaid)} zatim neuhrazeno.`
    )
  }

  // Missing documents and tax impact
  if (report.expenses.unmatched > 0 && report.tax_impact > 0) {
    lines.push(
      `Z toho ${formatCZK(report.expenses.unmatched)} vydaju nema prirazeny doklad, ` +
        `coz znamena dodatecnou danovou zatez ${formatCZK(report.tax_impact)}.`
    )

    lines.push(
      `Ztrata na dani z prijmu: ${formatCZK(report.tax_impact_breakdown.income_tax_loss)}, ` +
        `ztrata na odpoctu DPH: ${formatCZK(report.tax_impact_breakdown.vat_deduction_loss)}.`
    )
  } else if (report.expenses.unmatched === 0) {
    lines.push(
      `Vsechny vydaje maji prirazeny doklad - zadna dodatecna danova zatez.`
    )
  }

  // Matched expenses
  if (report.expenses.matched > 0) {
    lines.push(
      `Vydaje s dokladem: ${formatCZK(report.expenses.matched)}.`
    )
  }

  // Non-deductible expenses
  if (report.expenses.non_deductible > 0) {
    lines.push(
      `Danove neuznatelne naklady (pokuty, dary apod.): ${formatCZK(report.expenses.non_deductible)}.`
    )
  }

  // Ignored expenses
  if (report.expenses.ignored > 0) {
    lines.push(
      `Ignorovane transakce (mzdy, dane, prevody): ${formatCZK(report.expenses.ignored)}.`
    )
  }

  // Top missing documents highlight
  if (report.top_missing.length > 0) {
    const largest = report.top_missing[0]
    const singleTaxImpact = calculateTaxImpact(largest.amount)
    lines.push(
      `Nejvetsi chybejici doklad: ${formatCZK(largest.amount)} ` +
        `(${largest.description}${largest.counterparty ? ', ' + largest.counterparty : ''}) ` +
        `ze dne ${largest.date} - potencialni danova uspora ${formatCZK(singleTaxImpact.total)}.`
    )

    if (report.top_missing.length > 1) {
      lines.push(
        `Celkem ${report.top_missing.length} nejvetsich chybejicich dokladu.`
      )
    }
  }

  // Year-over-year comparison
  if (report.yoy_comparison) {
    const yoy = report.yoy_comparison
    const incomeDir = yoy.income_change_pct >= 0 ? 'narust' : 'pokles'
    const expenseDir = yoy.expense_change_pct >= 0 ? 'narust' : 'pokles'

    lines.push(
      `Mezirocni srovnani s ${yoy.previous_period}: ` +
        `prijmy ${incomeDir} ${Math.abs(yoy.income_change_pct).toFixed(1)} %, ` +
        `vydaje ${expenseDir} ${Math.abs(yoy.expense_change_pct).toFixed(1)} %.`
    )

    if (yoy.tax_impact_change !== 0) {
      const taxDir = yoy.tax_impact_change > 0 ? 'zvyseni' : 'snizeni'
      lines.push(
        `Danova zatez z chybejicich dokladu: ${taxDir} o ${formatCZK(Math.abs(yoy.tax_impact_change))}.`
      )
    }
  }

  return lines.join(' ')
}

// ============================================
// PERSISTENCE (Supabase)
// ============================================

/**
 * Save a financial report to the `financial_reports` table in Supabase.
 *
 * Uses upsert on (company_id, period) so that regenerating a report for
 * the same period overwrites the previous version.
 *
 * Expected table schema:
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   company_id UUID NOT NULL,
 *   period TEXT NOT NULL,
 *   company_name TEXT,
 *   generated_at TIMESTAMPTZ,
 *   report_data JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(company_id, period)
 *
 * Gracefully handles the case where the table does not yet exist by
 * logging a warning instead of throwing.
 *
 * @param report - The FinancialReport to persist
 */
export async function saveReport(report: FinancialReport): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('financial_reports')
      .upsert(
        {
          company_id: report.company_id,
          period: report.period,
          company_name: report.company_name,
          generated_at: report.generated_at,
          report_data: report as unknown as Record<string, unknown>,
        },
        {
          onConflict: 'company_id,period',
        }
      )

    if (error) {
      if (isTableMissingError(error.message)) {
        console.warn(
          '[report-generator] Table "financial_reports" does not exist. ' +
            'Report not saved. Create the table with the DDL in the saveReport() JSDoc.'
        )
        return
      }
      throw new Error(`Failed to save report: ${error.message}`)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    if (isTableMissingError(message)) {
      console.warn(
        `[report-generator] Could not save report: ${message}. ` +
          `Report for ${report.company_name} (${report.period}) was generated but not persisted.`
      )
      return
    }

    throw err
  }
}

/**
 * Retrieve all saved financial reports for a company, ordered by period
 * descending (most recent first).
 *
 * @param companyId - UUID of the company
 * @returns Array of FinancialReport objects (empty array if none found or table missing)
 */
export async function getReportsByCompany(
  companyId: string
): Promise<FinancialReport[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('financial_reports')
      .select('report_data')
      .eq('company_id', companyId)
      .order('period', { ascending: false })

    if (error) {
      if (isTableMissingError(error.message)) {
        console.warn(
          '[report-generator] Table "financial_reports" does not exist.'
        )
        return []
      }
      throw new Error(`Failed to fetch reports: ${error.message}`)
    }

    if (!data || data.length === 0) return []

    return data
      .map(
        (row: { report_data: unknown }) =>
          row.report_data as unknown as FinancialReport
      )
      .filter(Boolean)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    if (isTableMissingError(message)) {
      console.warn(`[report-generator] Could not read reports: ${message}`)
      return []
    }

    throw err
  }
}

// ============================================
// INTERNAL DATA ACCESS
// ============================================

/**
 * Load a single previously saved report from the database.
 * Used internally for year-over-year comparison.
 *
 * @param companyId - UUID of the company
 * @param period - Period string like '2025-01'
 * @returns The FinancialReport or null if not found
 */
async function loadReportFromDb(
  companyId: string,
  period: string
): Promise<FinancialReport | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('financial_reports')
      .select('report_data')
      .eq('company_id', companyId)
      .eq('period', period)
      .single()

    if (error) {
      // Row not found
      if (error.code === 'PGRST116') return null
      // Table does not exist
      if (isTableMissingError(error.message)) return null
      throw error
    }

    return (data?.report_data as unknown as FinancialReport) ?? null
  } catch {
    return null
  }
}
