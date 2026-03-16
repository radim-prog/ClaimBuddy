// Detailed tax impact calculation engine for missing documents
// Supports SRO (corporate) and OSVČ (self-employed) with full breakdown

export type LegalFormType = 'sro' | 'osvc'

export interface TaxImpactBreakdown {
  income_tax: number       // DzP — lost deduction * tax rate
  social_insurance: number // SP — lost deduction impact on social insurance
  health_insurance: number // ZP — lost deduction impact on health insurance
  vat: number              // DPH — lost VAT deduction (VAT payers only)
  total: number            // sum of all components
}

export interface DetailedTaxImpact extends TaxImpactBreakdown {
  amount: number           // original transaction amount (absolute)
  legal_form: LegalFormType
  vat_payer: boolean
}

export interface MonthlyTaxImpact {
  period: string           // YYYY-MM
  unmatched_count: number
  unmatched_total: number  // sum of unmatched amounts
  breakdown: TaxImpactBreakdown
  cumulative: TaxImpactBreakdown
}

export interface YearlyTaxImpact {
  year: number
  legal_form: LegalFormType
  vat_payer: boolean
  months: MonthlyTaxImpact[]
  total: TaxImpactBreakdown
  unmatched_count: number
  unmatched_total: number
}

// ── Tax rates (2025/2026) ──

const RATES = {
  sro: {
    income_tax: 0.21,        // Corp tax 21% (2025: 21%)
    social_insurance: 0,     // SRO: no social from missing docs (only salary-based)
    health_insurance: 0,     // SRO: no health from missing docs (only salary-based)
    // For SRO, missing expense doc means it's treated as owner's salary → taxed as personal income
    // Effective impact: income_tax on corporate level + if paid out → personal tax too
    // Simplified: just corporate tax rate since the expense can't be deducted
  },
  osvc: {
    income_tax: 0.15,        // Personal income tax 15%
    social_insurance: 0.292, // 29.2% of profit (self-employed pays both parts)
    health_insurance: 0.135, // 13.5% of profit (self-employed pays both parts)
    // Note: social/health are calculated on 50% of profit (assessment base)
    // So effective rates on lost deduction: 29.2% * 0.5 = 14.6%, 13.5% * 0.5 = 6.75%
  },
} as const

// For SRO: missing expense → can't deduct → higher taxable income → more corporate tax
// Additionally: unmatched expense may be treated as owner withdrawal → personal tax impact
// Simplified model: corporate tax + social/health equivalent of owner "salary" if withdrawn
const SRO_OWNER_RATES = {
  social: 0.071,  // 7.1% employee social insurance on owner "salary"
  health: 0.045,  // 4.5% employee health insurance on owner "salary"
}

/**
 * Calculate detailed tax impact for a single unmatched expense transaction.
 */
export function calculateDetailedTaxImpact(
  amount: number,
  legalForm: string,
  vatPayer: boolean
): DetailedTaxImpact {
  const absAmount = Math.abs(amount)

  // Only expenses (negative amounts) have tax impact from missing docs
  if (amount >= 0) {
    return {
      amount: absAmount,
      legal_form: normalizeLegalForm(legalForm),
      vat_payer: vatPayer,
      income_tax: 0,
      social_insurance: 0,
      health_insurance: 0,
      vat: 0,
      total: 0,
    }
  }

  const form = normalizeLegalForm(legalForm)

  // Base amount for tax calculation (exclude VAT if VAT payer)
  const baseAmount = vatPayer ? absAmount / 1.21 : absAmount

  let income_tax: number
  let social_insurance: number
  let health_insurance: number

  if (form === 'sro') {
    // SRO: lost corporate deduction
    income_tax = round(baseAmount * RATES.sro.income_tax)
    // SRO: if expense is unmatched, it's treated as owner withdrawal
    // Owner must pay personal social + health on it
    social_insurance = round(baseAmount * SRO_OWNER_RATES.social)
    health_insurance = round(baseAmount * SRO_OWNER_RATES.health)
  } else {
    // OSVČ: lost expense deduction → higher profit → more tax + insurance
    income_tax = round(baseAmount * RATES.osvc.income_tax)
    // Social/health on 50% assessment base
    social_insurance = round(baseAmount * 0.5 * RATES.osvc.social_insurance)
    health_insurance = round(baseAmount * 0.5 * RATES.osvc.health_insurance)
  }

  // VAT impact: lost input VAT deduction
  let vat = 0
  if (vatPayer) {
    vat = round(absAmount - baseAmount) // the VAT portion
  }

  const total = round(income_tax + social_insurance + health_insurance + vat)

  return {
    amount: absAmount,
    legal_form: form,
    vat_payer: vatPayer,
    income_tax,
    social_insurance,
    health_insurance,
    vat,
    total,
  }
}

/**
 * Calculate yearly tax impact with monthly breakdown and cumulative totals.
 */
export function calculateYearlyTaxImpact(
  transactions: Array<{
    period: string
    amount: number
    matched: boolean
  }>,
  legalForm: string,
  vatPayer: boolean
): YearlyTaxImpact {
  const form = normalizeLegalForm(legalForm)
  const year = transactions[0]?.period ? parseInt(transactions[0].period.split('-')[0]) : new Date().getFullYear()

  // Group unmatched expenses by month
  const monthlyMap = new Map<string, { count: number; total: number; breakdown: TaxImpactBreakdown }>()

  // Initialize all 12 months
  for (let m = 1; m <= 12; m++) {
    const period = `${year}-${String(m).padStart(2, '0')}`
    monthlyMap.set(period, {
      count: 0,
      total: 0,
      breakdown: { income_tax: 0, social_insurance: 0, health_insurance: 0, vat: 0, total: 0 },
    })
  }

  // Calculate per-transaction impact
  for (const tx of transactions) {
    if (tx.matched || tx.amount >= 0) continue

    const monthly = monthlyMap.get(tx.period)
    if (!monthly) continue

    const impact = calculateDetailedTaxImpact(tx.amount, legalForm, vatPayer)
    monthly.count++
    monthly.total += Math.abs(tx.amount)
    monthly.breakdown.income_tax += impact.income_tax
    monthly.breakdown.social_insurance += impact.social_insurance
    monthly.breakdown.health_insurance += impact.health_insurance
    monthly.breakdown.vat += impact.vat
    monthly.breakdown.total += impact.total
  }

  // Build monthly array with cumulative totals
  const months: MonthlyTaxImpact[] = []
  const cumulative: TaxImpactBreakdown = { income_tax: 0, social_insurance: 0, health_insurance: 0, vat: 0, total: 0 }
  let totalUnmatchedCount = 0
  let totalUnmatchedAmount = 0

  const sortedPeriods = Array.from(monthlyMap.keys()).sort()
  for (const period of sortedPeriods) {
    const data = monthlyMap.get(period)!

    // Round monthly values
    data.breakdown.income_tax = round(data.breakdown.income_tax)
    data.breakdown.social_insurance = round(data.breakdown.social_insurance)
    data.breakdown.health_insurance = round(data.breakdown.health_insurance)
    data.breakdown.vat = round(data.breakdown.vat)
    data.breakdown.total = round(data.breakdown.total)

    // Accumulate
    cumulative.income_tax = round(cumulative.income_tax + data.breakdown.income_tax)
    cumulative.social_insurance = round(cumulative.social_insurance + data.breakdown.social_insurance)
    cumulative.health_insurance = round(cumulative.health_insurance + data.breakdown.health_insurance)
    cumulative.vat = round(cumulative.vat + data.breakdown.vat)
    cumulative.total = round(cumulative.total + data.breakdown.total)

    totalUnmatchedCount += data.count
    totalUnmatchedAmount += data.total

    months.push({
      period,
      unmatched_count: data.count,
      unmatched_total: round(data.total),
      breakdown: { ...data.breakdown },
      cumulative: { ...cumulative },
    })
  }

  return {
    year,
    legal_form: form,
    vat_payer: vatPayer,
    months,
    total: { ...cumulative },
    unmatched_count: totalUnmatchedCount,
    unmatched_total: round(totalUnmatchedAmount),
  }
}

// ── Helpers ──

function normalizeLegalForm(legalForm: string): LegalFormType {
  const normalized = (legalForm || '').toLowerCase().replace(/[.\s]/g, '')
  if (normalized === 'sro' || normalized.includes('sro')) return 'sro'
  return 'osvc'
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
