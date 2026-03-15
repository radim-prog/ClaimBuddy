// DPP/DPČ utility functions and constants

export const DPP_ANNUAL_LIMIT = 10_000 // Kč/měsíc (limit pro účast na pojistném)
export const DPP_YEARLY_LIMIT = 77_500 // Kč/rok (u jednoho zaměstnavatele, 2025 draft)
export const DPC_MONTHLY_LIMIT = 4_000 // Kč/měsíc (limit pro účast na pojistném)
export const DPC_HOURS_LIMIT = 20 // max hodin/týden

export interface AgreementTaxImpact {
  gross: number
  employerCostHPP: number
  employerCostDPP: number
  employerSaving: number
  savingPercent: number
  workerNetHPP: number
  workerNetDPP: number
  socialInsuranceEmployer: number
  healthInsuranceEmployer: number
  noInsurance: boolean // under DPP limit = no insurance deductions
}

// Calculate tax impact comparison: HPP vs DPP for same gross amount
export function calculateAgreementTaxImpact(monthlyGross: number, hasTaxDeclaration: boolean): AgreementTaxImpact {
  const noInsurance = monthlyGross <= DPP_ANNUAL_LIMIT

  // --- HPP (full employment) ---
  const siEmployerHPP = Math.round(monthlyGross * 0.248) // 24.8% social insurance employer
  const hiEmployerHPP = Math.round(monthlyGross * 0.09)  // 9% health insurance employer
  const employerCostHPP = monthlyGross + siEmployerHPP + hiEmployerHPP

  const siEmployeeHPP = Math.round(monthlyGross * 0.065) // 6.5%
  const hiEmployeeHPP = Math.round(monthlyGross * 0.045) // 4.5%
  const taxBaseHPP = monthlyGross - siEmployeeHPP - hiEmployeeHPP
  const taxHPP = Math.max(0, Math.round(taxBaseHPP * 0.15) - (hasTaxDeclaration ? 2570 : 0))
  const workerNetHPP = monthlyGross - siEmployeeHPP - hiEmployeeHPP - taxHPP

  // --- DPP (under limit = no insurance) ---
  let siEmployerDPP = 0, hiEmployerDPP = 0
  let siEmployeeDPP = 0, hiEmployeeDPP = 0

  if (!noInsurance) {
    siEmployerDPP = Math.round(monthlyGross * 0.248)
    hiEmployerDPP = Math.round(monthlyGross * 0.09)
    siEmployeeDPP = Math.round(monthlyGross * 0.065)
    hiEmployeeDPP = Math.round(monthlyGross * 0.045)
  }

  const employerCostDPP = monthlyGross + siEmployerDPP + hiEmployerDPP

  let taxDPP: number
  if (noInsurance && !hasTaxDeclaration) {
    // Srážková daň 15%
    taxDPP = Math.round(monthlyGross * 0.15)
  } else {
    const taxBaseDPP = monthlyGross - siEmployeeDPP - hiEmployeeDPP
    taxDPP = Math.max(0, Math.round(taxBaseDPP * 0.15) - (hasTaxDeclaration ? 2570 : 0))
  }

  const workerNetDPP = monthlyGross - siEmployeeDPP - hiEmployeeDPP - taxDPP

  const employerSaving = employerCostHPP - employerCostDPP

  return {
    gross: monthlyGross,
    employerCostHPP,
    employerCostDPP,
    employerSaving,
    savingPercent: employerCostHPP > 0 ? Math.round((employerSaving / employerCostHPP) * 100) : 0,
    workerNetHPP,
    workerNetDPP,
    socialInsuranceEmployer: siEmployerDPP,
    healthInsuranceEmployer: hiEmployerDPP,
    noInsurance,
  }
}

// DPP/DPČ info content for education section
export const AGREEMENT_INFO = {
  dpp: {
    title: 'Dohoda o provedení práce (DPP)',
    rules: [
      'Maximálně 300 hodin/rok u jednoho zaměstnavatele',
      'Do 10 000 Kč/měsíc — bez odvodu sociálního a zdravotního pojištění',
      'Nad 10 000 Kč/měsíc — odvody jako u HPP',
      'Bez prohlášení k dani: srážková daň 15% (do limitu)',
      'S prohlášením: zálohová daň se slevou na poplatníka',
    ],
    warnings: [
      'Od 2025: sleduje se souhrn DPP u všech zaměstnavatelů (77 500 Kč/rok)',
      'Při překročení limitu se zpětně dopočítávají odvody',
      'Zaměstnanec na DPP nemá nárok na dovolenou (pokud není sjednána)',
    ],
  },
  dpc: {
    title: 'Dohoda o pracovní činnosti (DPČ)',
    rules: [
      'Maximálně 20 hodin/týden (průměr za období)',
      'Do 4 000 Kč/měsíc — bez odvodu pojistného',
      'Nad 4 000 Kč/měsíc — sociální + zdravotní pojištění',
      'Může být na dobu neurčitou',
      'Výpovědní doba 15 dnů (pokud není sjednáno jinak)',
    ],
    warnings: [
      'Zaměstnavatel musí vést evidenci odpracovaných hodin',
      'Při překročení 20h/týden hrozí sankce od inspektorátu práce',
    ],
  },
}
