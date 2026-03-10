// Pure functions for Czech income tax (DPFO) calculation

export type TaxRates = {
  income_tax_rate_1: number       // 0.15
  income_tax_rate_2: number       // 0.23
  income_tax_threshold: number    // 1935552 (48x average salary)
  taxpayer_discount: number       // 30840
  child_discount_1: number        // 15204
  child_discount_2: number        // 22320
  child_discount_3_plus: number   // 27840
  child_ztpp_multiplier: number   // 2
  social_insurance_rate: number   // 0.292
  health_insurance_rate: number   // 0.135
  social_minimum_advance: number  // 3852
  health_minimum_advance: number  // 2968
  social_max_assessment_base: number // 2110416
}

export const DEFAULT_TAX_RATES: TaxRates = {
  income_tax_rate_1: 0.15,
  income_tax_rate_2: 0.23,
  income_tax_threshold: 1935552,
  taxpayer_discount: 30840,
  child_discount_1: 15204,
  child_discount_2: 22320,
  child_discount_3_plus: 27840,
  child_ztpp_multiplier: 2,
  social_insurance_rate: 0.292,
  health_insurance_rate: 0.135,
  social_minimum_advance: 3852,
  health_minimum_advance: 2968,
  social_max_assessment_base: 2110416,
}

export type TaxAnnualConfig = {
  mortgage_interest: number
  savings_contributions: number
  other_deductions: number
  taxpayer_discount: boolean
  children_count: number
  children_details: Array<{ order: number; ztpp: boolean }>
  other_credits: number
  social_advances_paid: number
  health_advances_paid: number
  initial_tax_base: number | null
}

export type IncomeTaxCalculation = {
  // Step 1: Base
  revenue: number
  expenses: number
  rawTaxBase: number
  taxBaseOverride: number | null

  // Step 2: Deductions
  totalDeductions: number
  adjustedBase: number
  roundedBase: number

  // Step 3: Tax
  taxRate1Amount: number
  taxRate2Amount: number
  grossTax: number

  // Step 4: Credits
  taxpayerCredit: number
  childrenCredit: number
  otherCredits: number
  totalCredits: number
  netTax: number

  // Step 5: Social insurance
  socialBase: number
  socialCalculated: number
  socialAdvancesPaid: number
  socialDue: number

  // Step 6: Health insurance
  healthBase: number
  healthCalculated: number
  healthAdvancesPaid: number
  healthDue: number

  // Step 7: Total
  totalDue: number

  // Step 8: Savings
  initialTaxBase: number | null
  taxSavings: number | null
}

export function calculateIncomeTax(
  yearTotals: { revenue: number; expenses: number },
  config: TaxAnnualConfig,
  rates: TaxRates,
  taxBaseOverride?: number | null
): IncomeTaxCalculation {
  const { revenue, expenses } = yearTotals
  const rawTaxBase = revenue - expenses
  const effectiveBase = taxBaseOverride ?? rawTaxBase

  // Deductions
  const totalDeductions = config.mortgage_interest + config.savings_contributions + config.other_deductions
  const adjustedBase = Math.max(0, effectiveBase - totalDeductions)
  // Round down to hundreds
  const roundedBase = Math.floor(adjustedBase / 100) * 100

  // Tax calculation (progressive: 15% up to threshold, 23% above)
  let taxRate1Amount: number
  let taxRate2Amount: number
  if (roundedBase <= rates.income_tax_threshold) {
    taxRate1Amount = roundedBase * rates.income_tax_rate_1
    taxRate2Amount = 0
  } else {
    taxRate1Amount = rates.income_tax_threshold * rates.income_tax_rate_1
    taxRate2Amount = (roundedBase - rates.income_tax_threshold) * rates.income_tax_rate_2
  }
  const grossTax = Math.round(taxRate1Amount + taxRate2Amount)

  // Credits
  const taxpayerCredit = config.taxpayer_discount ? rates.taxpayer_discount : 0

  let childrenCredit = 0
  if (config.children_details && config.children_details.length > 0) {
    for (const child of config.children_details) {
      let discount: number
      if (child.order === 1) discount = rates.child_discount_1
      else if (child.order === 2) discount = rates.child_discount_2
      else discount = rates.child_discount_3_plus
      if (child.ztpp) discount *= rates.child_ztpp_multiplier
      childrenCredit += discount
    }
  } else if (config.children_count > 0) {
    // Simple mode: just count
    const count = Math.floor(config.children_count)
    for (let i = 1; i <= count; i++) {
      if (i === 1) childrenCredit += rates.child_discount_1
      else if (i === 2) childrenCredit += rates.child_discount_2
      else childrenCredit += rates.child_discount_3_plus
    }
  }

  const totalCredits = taxpayerCredit + childrenCredit + config.other_credits
  // Tax after credits can go negative (bonus for children)
  const netTax = grossTax - totalCredits

  // Social insurance: profit × 50% × rate
  const profit = Math.max(0, effectiveBase)
  const socialBase = Math.min(profit * 0.5, rates.social_max_assessment_base)
  const socialCalculated = Math.round(socialBase * rates.social_insurance_rate)
  const socialDue = socialCalculated - config.social_advances_paid

  // Health insurance: profit × 50% × rate
  const healthBase = profit * 0.5
  const healthCalculated = Math.round(healthBase * rates.health_insurance_rate)
  const healthDue = healthCalculated - config.health_advances_paid

  // Total
  const totalDue = Math.max(0, netTax) + Math.max(0, socialDue) + Math.max(0, healthDue)

  // Savings calculation
  let taxSavings: number | null = null
  if (config.initial_tax_base !== null && config.initial_tax_base !== undefined) {
    const initialCalc = calculateIncomeTax(
      { revenue: config.initial_tax_base + expenses, expenses },
      { ...config, mortgage_interest: 0, savings_contributions: 0, other_deductions: 0 },
      rates,
      config.initial_tax_base
    )
    taxSavings = initialCalc.totalDue - totalDue
  }

  return {
    revenue,
    expenses,
    rawTaxBase,
    taxBaseOverride: taxBaseOverride ?? null,
    totalDeductions,
    adjustedBase,
    roundedBase,
    taxRate1Amount: Math.round(taxRate1Amount),
    taxRate2Amount: Math.round(taxRate2Amount),
    grossTax,
    taxpayerCredit,
    childrenCredit,
    otherCredits: config.other_credits,
    totalCredits,
    netTax,
    socialBase,
    socialCalculated,
    socialAdvancesPaid: config.social_advances_paid,
    socialDue,
    healthBase,
    healthCalculated,
    healthAdvancesPaid: config.health_advances_paid,
    healthDue,
    totalDue,
    initialTaxBase: config.initial_tax_base,
    taxSavings,
  }
}
