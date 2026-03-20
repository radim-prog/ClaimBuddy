// Pure functions for Czech income tax (DPFO) calculation

export type FlatTaxBand = {
  revenue_limit: number
  monthly_tax: number
  monthly_social: number
  monthly_health: number
}

export type TaxRates = {
  income_tax_rate_1: number       // 0.15
  income_tax_rate_2: number       // 0.23
  income_tax_threshold: number    // 48× průměrná mzda (pro 2024: 48×40324 = 1935552)
  taxpayer_discount: number       // 30840
  child_discount_1: number        // 15204
  child_discount_2: number        // 22320
  child_discount_3_plus: number   // 27840
  child_ztpp_multiplier: number   // 2
  social_insurance_rate: number   // 0.292
  health_insurance_rate: number   // 0.135
  social_base_percentage: number  // 0.55 (since 2024)
  health_base_percentage: number  // 0.50
  social_minimum_advance: number  // 5720 (main activity)
  health_minimum_advance: number  // 3306 (main activity)
  social_minimum_advance_secondary: number  // 1574
  health_minimum_advance_secondary: number  // 0
  social_max_assessment_base: number // 2110416
  health_min_assessment_base: number // Min. VZ ZP = 0.5 × průměrná mzda × 12 (2025: 279342)
  disability_credit_1: number     // Invalidita 1./2. stupně (2520)
  disability_credit_2: number     // Invalidita 3. stupně (5040)
  disability_credit_3: number     // ZTP/P (16140)
  student_credit: number          // 0 (zrušeno od 2024, konfigurovatelné per-year pro starší roky)
  dppo_rate: number               // 0.21 (21% od 2024, dříve 0.19)
  deduction_limit_savings: number // 48000 (DIP+penzijko+živ.poj. celkem)
  deduction_limit_mortgage: number // 150000 (hypotéka, smlouvy od 2021)
  flat_tax_bands?: Record<number, FlatTaxBand>
}

// Fallback sazby pro rok 2025
// Zdroj: ČSSZ (cssz.cz), VZP (vzp.cz)
// Průměrná mzda 2025: 46 557 Kč/měs
export const DEFAULT_TAX_RATES: TaxRates = {
  income_tax_rate_1: 0.15,
  income_tax_rate_2: 0.23,
  income_tax_threshold: 2234736,
  taxpayer_discount: 30840,
  child_discount_1: 15204,
  child_discount_2: 22320,
  child_discount_3_plus: 27840,
  child_ztpp_multiplier: 2,
  social_insurance_rate: 0.292,
  health_insurance_rate: 0.135,
  social_base_percentage: 0.55,
  health_base_percentage: 0.50,
  social_minimum_advance: 4759,
  health_minimum_advance: 3143,
  social_minimum_advance_secondary: 1496,
  health_minimum_advance_secondary: 0,
  social_max_assessment_base: 2234736,
  health_min_assessment_base: 279342, // 0.5 × 46557 × 12 (2025 average wage 46557)
  disability_credit_1: 2520,
  disability_credit_2: 5040,
  disability_credit_3: 16140,
  student_credit: 0,
  dppo_rate: 0.21,
  deduction_limit_savings: 48000,
  deduction_limit_mortgage: 150000,
  flat_tax_bands: {
    1: { revenue_limit: 1000000, monthly_tax: 100, monthly_social: 6578, monthly_health: 3143 },
    2: { revenue_limit: 1500000, monthly_tax: 4963, monthly_social: 8191, monthly_health: 3591 },
    3: { revenue_limit: 2000000, monthly_tax: 9320, monthly_social: 12527, monthly_health: 5292 },
  },
}

export type TaxAnnualConfig = {
  mortgage_interest: number
  dip_contributions: number
  savings_contributions: number
  other_deductions: number
  taxpayer_discount: boolean
  children_count: number
  children_details: Array<{ order: number; ztpp: boolean }>
  other_credits: number
  social_advances_paid: number
  health_advances_paid: number
  initial_tax_base: number | null
  is_flat_tax: boolean
  flat_tax_band: number | null
  is_secondary_activity: boolean
}

export type FlatTaxCalculation = {
  band: number
  revenueLimit: number
  monthlyTotal: number
  annualTax: number
  annualSocial: number
  annualHealth: number
  annualTotal: number
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
  socialFromRate: number
  socialMinimumAnnual: number
  socialMinimumApplied: boolean
  socialCalculated: number
  socialAdvancesPaid: number
  socialDue: number

  // Step 6: Health insurance
  healthBase: number
  healthFromRate: number
  healthMinimumAnnual: number
  healthMinimumApplied: boolean
  healthCalculated: number
  healthAdvancesPaid: number
  healthDue: number

  // Step 7: Total
  totalDue: number

  // Step 8: Savings
  initialTaxBase: number | null
  taxSavings: number | null

  // Step 9: Flat tax
  flatTax: FlatTaxCalculation | null
}

export function calculateFlatTax(band: number, rates: TaxRates): FlatTaxCalculation | null {
  const bands = rates.flat_tax_bands
  if (!bands || !bands[band]) return null
  const b = bands[band]
  const monthlyTotal = b.monthly_tax + b.monthly_social + b.monthly_health
  return {
    band,
    revenueLimit: b.revenue_limit,
    monthlyTotal,
    annualTax: b.monthly_tax * 12,
    annualSocial: b.monthly_social * 12,
    annualHealth: b.monthly_health * 12,
    annualTotal: monthlyTotal * 12,
  }
}

export function calculateIncomeTax(
  yearTotals: { revenue: number; expenses: number },
  config: TaxAnnualConfig,
  rates: TaxRates,
  taxBaseOverride?: number | null
): IncomeTaxCalculation {
  const { revenue, expenses } = yearTotals
  const rawTaxBase = revenue - expenses

  // Flat tax early return
  if (config.is_flat_tax && config.flat_tax_band) {
    const flatTax = calculateFlatTax(config.flat_tax_band, rates)
    if (flatTax) {
      return {
        revenue, expenses, rawTaxBase,
        taxBaseOverride: null,
        totalDeductions: 0, adjustedBase: 0, roundedBase: 0,
        taxRate1Amount: 0, taxRate2Amount: 0, grossTax: 0,
        taxpayerCredit: 0, childrenCredit: 0, otherCredits: 0, totalCredits: 0,
        netTax: flatTax.annualTax,
        socialBase: 0, socialFromRate: 0,
        socialMinimumAnnual: 0, socialMinimumApplied: false,
        socialCalculated: flatTax.annualSocial,
        socialAdvancesPaid: config.social_advances_paid,
        socialDue: flatTax.annualSocial - config.social_advances_paid,
        healthBase: 0, healthFromRate: 0,
        healthMinimumAnnual: 0, healthMinimumApplied: false,
        healthCalculated: flatTax.annualHealth,
        healthAdvancesPaid: config.health_advances_paid,
        healthDue: flatTax.annualHealth - config.health_advances_paid,
        totalDue: flatTax.annualTotal - config.social_advances_paid - config.health_advances_paid,
        initialTaxBase: null,
        taxSavings: null,
        flatTax,
      }
    }
  }

  const effectiveBase = taxBaseOverride ?? rawTaxBase

  // Deductions
  const totalDeductions = config.mortgage_interest + (config.dip_contributions || 0) + config.savings_contributions + config.other_deductions
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

  // Non-refundable credits (cannot reduce tax below 0): taxpayer, other
  const nonRefundableCredits = taxpayerCredit + config.other_credits
  const taxAfterNonRefundable = Math.max(0, grossTax - nonRefundableCredits)

  // Refundable credits (can create tax bonus = negative tax): children
  const totalCredits = nonRefundableCredits + childrenCredit
  const netTax = taxAfterNonRefundable - childrenCredit

  // Social insurance: profit × base_percentage × rate, enforce minimum
  const profit = Math.max(0, effectiveBase)
  const socialBase = Math.min(profit * rates.social_base_percentage, rates.social_max_assessment_base)
  const socialFromRate = Math.round(socialBase * rates.social_insurance_rate)

  const socialMinMonthly = config.is_secondary_activity
    ? rates.social_minimum_advance_secondary
    : rates.social_minimum_advance
  const socialMinimumAnnual = socialMinMonthly * 12
  const socialMinimumApplied = socialFromRate < socialMinimumAnnual && !config.is_secondary_activity
  const socialCalculated = config.is_secondary_activity
    ? socialFromRate  // secondary: no minimum enforcement
    : Math.max(socialFromRate, socialMinimumAnnual)
  const socialDue = socialCalculated - config.social_advances_paid

  // Health insurance: profit × base_percentage × rate, enforce minimum assessment base
  const healthBaseRaw = profit * rates.health_base_percentage
  // Minimum assessment base applies for main activity (0.5 × avg wage × 12)
  const healthMinBase = config.is_secondary_activity ? 0 : (rates.health_min_assessment_base || 0)
  const healthBase = Math.max(healthBaseRaw, healthMinBase)
  const healthFromRate = Math.round(healthBase * rates.health_insurance_rate)

  const healthMinMonthly = config.is_secondary_activity
    ? rates.health_minimum_advance_secondary
    : rates.health_minimum_advance
  const healthMinimumAnnual = healthMinMonthly * 12
  const healthMinimumApplied = healthBase > healthBaseRaw
  const healthCalculated = Math.max(healthFromRate, healthMinimumAnnual)
  const healthDue = healthCalculated - config.health_advances_paid

  // Total
  const totalDue = Math.max(0, netTax) + Math.max(0, socialDue) + Math.max(0, healthDue)

  // Savings calculation
  let taxSavings: number | null = null
  if (config.initial_tax_base !== null && config.initial_tax_base !== undefined) {
    const initialCalc = calculateIncomeTax(
      { revenue: config.initial_tax_base + expenses, expenses },
      { ...config, mortgage_interest: 0, dip_contributions: 0, savings_contributions: 0, other_deductions: 0, is_flat_tax: false },
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
    socialFromRate,
    socialMinimumAnnual,
    socialMinimumApplied,
    socialCalculated,
    socialAdvancesPaid: config.social_advances_paid,
    socialDue,
    healthBase,
    healthFromRate,
    healthMinimumAnnual,
    healthMinimumApplied,
    healthCalculated,
    healthAdvancesPaid: config.health_advances_paid,
    healthDue,
    totalDue,
    initialTaxBase: config.initial_tax_base,
    taxSavings,
    flatTax: null,
  }
}

// Employee annual tax settlement (roční zúčtování zaměstnance)

export type EmployeeTaxConfig = {
  gross_income: number
  mortgage_interest: number
  dip_contributions: number
  savings_contributions: number
  life_insurance: number
  other_deductions: number
  taxpayer_discount: boolean
  children_count: number
  children_details: Array<{ order: number; ztpp: boolean }>
  disability_credit: number // 0 = none, 1 = invalidita 1./2. st., 2 = invalidita 3. st.
  ztpp: boolean             // průkaz ZTP/P (nezávislý na disability_credit)
  student: boolean
  other_credits: number
  tax_advances_paid: number
}

export type EmployeeTaxCalculation = {
  grossIncome: number
  totalDeductions: number
  adjustedBase: number
  roundedBase: number
  taxRate1Amount: number
  taxRate2Amount: number
  grossTax: number
  taxpayerCredit: number
  childrenCredit: number
  disabilityCredit: number
  ztppCredit: number
  studentCredit: number
  otherCredits: number
  totalCredits: number
  netTax: number
  taxAdvancesPaid: number
  taxDue: number
}

export function calculateEmployeeTax(
  config: EmployeeTaxConfig,
  rates: TaxRates
): EmployeeTaxCalculation {
  const grossIncome = config.gross_income

  // Deductions
  const totalDeductions = config.mortgage_interest + config.dip_contributions
    + config.savings_contributions + config.life_insurance + config.other_deductions

  const adjustedBase = Math.max(0, grossIncome - totalDeductions)
  const roundedBase = Math.floor(adjustedBase / 100) * 100

  // Progressive tax 15%/23%
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
    const count = Math.floor(config.children_count)
    for (let i = 1; i <= count; i++) {
      if (i === 1) childrenCredit += rates.child_discount_1
      else if (i === 2) childrenCredit += rates.child_discount_2
      else childrenCredit += rates.child_discount_3_plus
    }
  }

  // Disability credit: 1 = invalidita 1./2. st., 2 = invalidita 3. st.
  let disabilityCredit = 0
  if (config.disability_credit === 1) disabilityCredit = rates.disability_credit_1
  else if (config.disability_credit === 2) disabilityCredit = rates.disability_credit_2

  // ZTP/P: separate from disability, can combine
  const ztppCredit = config.ztpp ? rates.disability_credit_3 : 0

  const studentCredit = config.student ? rates.student_credit : 0

  // Non-refundable credits (cannot reduce tax below 0)
  const nonRefundableCredits = taxpayerCredit + disabilityCredit + ztppCredit + studentCredit + config.other_credits
  const taxAfterNonRefundable = Math.max(0, grossTax - nonRefundableCredits)

  // Refundable credit (children = daňový bonus, can go negative)
  const totalCredits = nonRefundableCredits + childrenCredit
  const netTax = taxAfterNonRefundable - childrenCredit
  const taxDue = netTax - config.tax_advances_paid

  return {
    grossIncome,
    totalDeductions,
    adjustedBase,
    roundedBase,
    taxRate1Amount: Math.round(taxRate1Amount),
    taxRate2Amount: Math.round(taxRate2Amount),
    grossTax,
    taxpayerCredit,
    childrenCredit,
    disabilityCredit,
    ztppCredit,
    studentCredit,
    otherCredits: config.other_credits,
    totalCredits,
    netTax,
    taxAdvancesPaid: config.tax_advances_paid,
    taxDue,
  }
}
