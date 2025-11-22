/**
 * Jednoduchá daňová kalkulačka
 * Vypočítá odhad daní z příjmů, DPH, sociálního a zdravotního pojištění
 */

export interface TaxCalculationResult {
  // Vstupní data
  income: number;
  expenses: number;
  grossProfit: number;

  // DPH
  vatPayable: number | null; // null pokud není plátce DPH

  // Daň z příjmů
  incomeTaxBase: number; // Základ daně
  incomeTax: number; // Výsledná daň (15% nebo 23%)

  // Pojištění (pouze FO)
  socialInsurance: number | null;
  healthInsurance: number | null;

  // Celková daňová zátěž
  totalTaxBurden: number;
}

export interface CompanyTaxSettings {
  isVATPayer: boolean;
  legalForm: 'sro' | 'fyzicka_osoba' | 'as' | 'vos';
}

// Daňové sazby 2025
const TAX_RATES = {
  VAT_STANDARD: 21, // Standardní sazba DPH
  INCOME_TAX_BASIC: 15, // 15% do 48x průměrná mzda
  INCOME_TAX_HIGH: 23, // 23% nad 48x průměrná mzda
  INCOME_TAX_SRO: 19, // Daň z příjmů právnických osob
  SOCIAL_INSURANCE: 29.2, // Sociální pojištění FO
  HEALTH_INSURANCE: 13.5, // Zdravotní pojištění FO
  MIN_ASSESSMENT_BASE_SOCIAL: 3546, // Minimální vyměřovací základ 2025
  MIN_ASSESSMENT_BASE_HEALTH: 3546,
  AVERAGE_SALARY_2025: 45_000, // Průměrná mzda 2025 (odhad)
};

/**
 * Vypočítá odhad daní pro daný měsíc
 */
export function calculateMonthlyTaxes(
  income: number,
  expenses: number,
  settings: CompanyTaxSettings
): TaxCalculationResult {
  const grossProfit = income - expenses;

  // DPH
  const vatPayable = settings.isVATPayer
    ? calculateVAT(income, expenses)
    : null;

  // Daň z příjmů
  let incomeTax = 0;
  let incomeTaxBase = grossProfit;

  if (settings.legalForm === 'sro' || settings.legalForm === 'as') {
    // Právnická osoba: 19% daň z příjmů
    incomeTax = grossProfit * (TAX_RATES.INCOME_TAX_SRO / 100);
  } else {
    // Fyzická osoba: 15% nebo 23%
    // Zjednodušená kalkulace (bez slev, paušálů atd.)
    const yearlyEstimate = grossProfit * 12;
    const threshold = TAX_RATES.AVERAGE_SALARY_2025 * 48;

    if (yearlyEstimate > threshold) {
      // Část do threshold: 15%, nad threshold: 23%
      const belowThreshold = threshold / 12;
      const aboveThreshold = grossProfit - belowThreshold;
      incomeTax =
        belowThreshold * (TAX_RATES.INCOME_TAX_BASIC / 100) +
        aboveThreshold * (TAX_RATES.INCOME_TAX_HIGH / 100);
    } else {
      incomeTax = grossProfit * (TAX_RATES.INCOME_TAX_BASIC / 100);
    }
  }

  // Sociální a zdravotní pojištění (pouze FO)
  let socialInsurance = null;
  let healthInsurance = null;

  if (settings.legalForm === 'fyzicka_osoba') {
    const assessmentBase = Math.max(
      grossProfit * 0.5, // 50% příjmů po odpočtu výdajů
      TAX_RATES.MIN_ASSESSMENT_BASE_SOCIAL
    );
    socialInsurance = assessmentBase * (TAX_RATES.SOCIAL_INSURANCE / 100);
    healthInsurance = assessmentBase * (TAX_RATES.HEALTH_INSURANCE / 100);
  }

  // Celková daňová zátěž
  const totalTaxBurden =
    (vatPayable || 0) +
    incomeTax +
    (socialInsurance || 0) +
    (healthInsurance || 0);

  return {
    income,
    expenses,
    grossProfit,
    vatPayable,
    incomeTaxBase,
    incomeTax,
    socialInsurance,
    healthInsurance,
    totalTaxBurden,
  };
}

/**
 * Vypočítá DPH k odvedení (na výstupu mínus na vstupu)
 */
function calculateVAT(income: number, expenses: number): number {
  // Zjednodušená kalkulace: předpokládáme že vše je s DPH
  const vatOnIncome = income * (TAX_RATES.VAT_STANDARD / (100 + TAX_RATES.VAT_STANDARD));
  const vatOnExpenses = expenses * (TAX_RATES.VAT_STANDARD / (100 + TAX_RATES.VAT_STANDARD));
  return Math.round((vatOnIncome - vatOnExpenses) * 100) / 100;
}

/**
 * Vypočítá "červená čísla" - ztrátu na daních když chybí doklad
 */
export function calculateMissingDocumentPenalty(
  documentAmount: number,
  settings: CompanyTaxSettings
): number {
  // Pokud chybí výdajový doklad, přicházíme o:
  // 1. DPH na vstupu (pokud plátce)
  // 2. Výdaj snižující základ daně

  let penalty = 0;

  // DPH
  if (settings.isVATPayer) {
    const vatLoss = documentAmount * (TAX_RATES.VAT_STANDARD / (100 + TAX_RATES.VAT_STANDARD));
    penalty += vatLoss;
  }

  // Daň z příjmů
  const taxRate =
    settings.legalForm === 'sro' || settings.legalForm === 'as'
      ? TAX_RATES.INCOME_TAX_SRO
      : TAX_RATES.INCOME_TAX_BASIC;

  const incomeTaxLoss = documentAmount * (taxRate / 100);
  penalty += incomeTaxLoss;

  return Math.round(penalty);
}

/**
 * Vypočítá roční projekci daní na základě dosavadních měsíců
 */
export function calculateYearlyProjection(
  monthlyResults: TaxCalculationResult[]
): TaxCalculationResult {
  const totalIncome = monthlyResults.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = monthlyResults.reduce((sum, r) => sum + r.expenses, 0);
  const totalGrossProfit = monthlyResults.reduce((sum, r) => sum + r.grossProfit, 0);

  const totalVatPayable = monthlyResults.reduce((sum, r) => sum + (r.vatPayable || 0), 0);
  const totalIncomeTax = monthlyResults.reduce((sum, r) => sum + r.incomeTax, 0);
  const totalSocialInsurance = monthlyResults.reduce((sum, r) => sum + (r.socialInsurance || 0), 0);
  const totalHealthInsurance = monthlyResults.reduce((sum, r) => sum + (r.healthInsurance || 0), 0);

  return {
    income: totalIncome,
    expenses: totalExpenses,
    grossProfit: totalGrossProfit,
    vatPayable: totalVatPayable > 0 ? totalVatPayable : null,
    incomeTaxBase: totalGrossProfit,
    incomeTax: totalIncomeTax,
    socialInsurance: totalSocialInsurance > 0 ? totalSocialInsurance : null,
    healthInsurance: totalHealthInsurance > 0 ? totalHealthInsurance : null,
    totalTaxBurden: totalVatPayable + totalIncomeTax + totalSocialInsurance + totalHealthInsurance,
  };
}
