// Educational/informational content for DPP/DPC agreements
// Used by client portal and info endpoints

import { INSURANCE_THRESHOLD, MAX_HOURS, RATES, isAboveThreshold, calculateDohodaMesic } from '@/lib/types/dohodari'
import type { DohodaType, TaxType } from '@/lib/types/dohodari'

export type DohodaExplanation = {
  summary: string
  insurance: {
    pays: boolean
    reason: string
    social: { employee: string; employer: string }
    health: { employee: string; employer: string }
  }
  tax: {
    type: TaxType
    rate: string
    credits: string[]
    netEstimate: number
  }
  warnings: string[]
  tips: string[]
}

export function getDohodaExplanation(params: {
  type: DohodaType
  monthlyGross: number
  hasTaxDeclaration: boolean
  isStudent?: boolean
  hasOtherEmployer?: boolean
}): DohodaExplanation {
  const { type, monthlyGross, hasTaxDeclaration, isStudent = false, hasOtherEmployer = false } = params
  const threshold = INSURANCE_THRESHOLD[type]
  const aboveThreshold = isAboveThreshold(type, monthlyGross)
  const typeName = type === 'dpp' ? 'DPP' : 'DPČ'

  // Calculate actual numbers
  const calc = calculateDohodaMesic({
    typ: type,
    hodiny: 1, // dummy — we override gross via sazba * hodiny
    sazba: monthlyGross,
    prohlaseni: hasTaxDeclaration,
    student: isStudent,
  })

  // --- Summary ---
  let summary: string
  if (aboveThreshold) {
    summary = `Vaše ${typeName} s odměnou ${formatCZK(monthlyGross)}/měs je nad limitem ${formatCZK(threshold)}. Platíte sociální i zdravotní pojištění jako u běžného zaměstnání.`
  } else {
    summary = `Vaše ${typeName} s odměnou ${formatCZK(monthlyGross)}/měs je pod limitem ${formatCZK(threshold)}. Neplatíte sociální ani zdravotní pojištění — úspora pro zaměstnavatele.`
  }

  // --- Insurance ---
  const insurance = {
    pays: aboveThreshold,
    reason: aboveThreshold
      ? `Odměna překračuje limit ${formatCZK(threshold)}/měs → povinné odvody`
      : `Odměna je pod limitem ${formatCZK(threshold)}/měs → bez odvodů`,
    social: aboveThreshold
      ? { employee: `${(RATES.social_employee * 100).toFixed(1)}% (${formatCZK(calc.social_employee)})`, employer: `${(RATES.social_employer * 100).toFixed(1)}% (${formatCZK(calc.social_employer)})` }
      : { employee: '0 Kč', employer: '0 Kč' },
    health: aboveThreshold
      ? { employee: `${(RATES.health_employee * 100).toFixed(1)}% (${formatCZK(calc.health_employee)})`, employer: `${(RATES.health_employer * 100).toFixed(1)}% (${formatCZK(calc.health_employer)})` }
      : { employee: '0 Kč', employer: '0 Kč' },
  }

  // --- Tax ---
  const credits: string[] = []
  if (hasTaxDeclaration) {
    credits.push(`Sleva na poplatníka: ${formatCZK(RATES.tax_credit_basic)}/měs`)
    if (isStudent) credits.push(`Sleva na studenta: ${formatCZK(RATES.tax_credit_student)}/měs`)
  }

  const tax = {
    type: calc.tax_type,
    rate: calc.tax_type === 'srazkova'
      ? '15% srážková daň (bez slev)'
      : '15% zálohová daň (se slevami)',
    credits,
    netEstimate: calc.net,
  }

  // --- Warnings ---
  const warnings: string[] = []
  if (type === 'dpp') {
    warnings.push(`${typeName}: maximálně ${MAX_HOURS.dpp.label}`)
  } else {
    warnings.push(`${typeName}: maximálně ${MAX_HOURS.dpc.label}`)
  }

  if (hasOtherEmployer && hasTaxDeclaration) {
    warnings.push('Prohlášení k dani lze podepsat pouze u jednoho zaměstnavatele!')
  }

  if (type === 'dpp' && !aboveThreshold) {
    warnings.push('Od 2025: sleduje se souhrn DPP u VŠECH zaměstnavatelů (limit 77 500 Kč/rok)')
  }

  if (aboveThreshold) {
    warnings.push('Při překročení limitu se odvádí pojistné → vyšší náklady zaměstnavatele')
  }

  // --- Tips ---
  const tips: string[] = []
  if (!aboveThreshold) {
    const savingPct = Math.round((1 - calc.total_employer_cost / (monthlyGross * 1.338)) * 100)
    tips.push(`Pod limitem ${formatCZK(threshold)}/měs = bez odvodů → úspora zaměstnavatele ~${savingPct}%`)
  }

  if (!hasTaxDeclaration && !aboveThreshold) {
    tips.push('Bez prohlášení: srážková daň 15% — daň je konečná, nemusíte podávat přiznání')
  }

  if (hasTaxDeclaration) {
    tips.push('S prohlášením: zálohová daň se slevou na poplatníka — nižší daňová povinnost')
  }

  if (isStudent) {
    tips.push('Jako student máte nárok na dodatečnou slevu na dani')
  }

  return { summary, insurance, tax, warnings, tips }
}

// Client info endpoint data
export function getDohodaInfoContent() {
  return {
    dpp: {
      title: 'Dohoda o provedení práce (DPP)',
      limit: INSURANCE_THRESHOLD.dpp,
      maxHours: MAX_HOURS.dpp,
      rules: [
        `Maximálně ${MAX_HOURS.dpp.value} hodin/rok u jednoho zaměstnavatele`,
        `Do ${formatCZK(INSURANCE_THRESHOLD.dpp)}/měsíc — bez odvodů sociálního a zdravotního pojištění`,
        `Nad ${formatCZK(INSURANCE_THRESHOLD.dpp)}/měsíc — plné odvody jako u HPP`,
        'Bez prohlášení k dani: srážková daň 15% (konečná)',
        'S prohlášením: zálohová daň se slevou na poplatníka',
      ],
    },
    dpc: {
      title: 'Dohoda o pracovní činnosti (DPČ)',
      limit: INSURANCE_THRESHOLD.dpc,
      maxHours: MAX_HOURS.dpc,
      rules: [
        `Maximálně ${MAX_HOURS.dpc.value} hodin/týden (průměr za období)`,
        `Do ${formatCZK(INSURANCE_THRESHOLD.dpc)}/měsíc — bez odvodů pojistného`,
        `Nad ${formatCZK(INSURANCE_THRESHOLD.dpc)}/měsíc — sociální + zdravotní pojištění`,
        'Může být na dobu neurčitou',
        'Výpovědní doba 15 dnů (pokud není sjednáno jinak)',
      ],
    },
    rates: RATES,
  }
}

function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}
