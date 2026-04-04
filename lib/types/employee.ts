// Typy pro evidenci zaměstnanců

export type WageType = 'fixed' | 'hourly'

export type DeductionType = 'exekuce' | 'alimenty' | 'insolvence' | 'srazka_zamestnavatel' | 'other'

export type Deduction = {
  id: string
  type: DeductionType
  description: string
  amount: number // Částka nebo procento
  is_percentage: boolean // true = procento z čisté mzdy, false = fixní částka
  priority: number // Pořadí srážek (1 = nejvyšší priorita)
  creditor?: string // Věřitel (např. exekutor, příjemce alimentů)
  reference_number?: string // Číslo jednací, spisová značka
  start_date: string
  end_date?: string | null // null = trvalá srážka
  active: boolean
}

export type HealthInsuranceCode = '111' | '201' | '205' | '207' | '209' | '211' | '213'

export const HEALTH_INSURANCE_COMPANIES: Record<HealthInsuranceCode, string> = {
  '111': 'VZP - Všeobecná zdravotní pojišťovna',
  '201': 'VoZP - Vojenská zdravotní pojišťovna',
  '205': 'ČPZP - Česká průmyslová zdravotní pojišťovna',
  '207': 'OZP - Oborová zdravotní pojišťovna',
  '209': 'ZPŠ - Zaměstnanecká pojišťovna Škoda',
  '211': 'ZPMV - Zdravotní pojišťovna ministerstva vnitra',
  '213': 'RBP - Revírní bratrská pokladna',
}

export type Employee = {
  id: string
  company_id: string

  // Osobní údaje
  first_name: string
  last_name: string
  birth_date: string
  personal_id?: string // Rodné číslo (volitelné, citlivý údaj)

  // Kontakt
  email?: string
  phone?: string
  address?: string

  // Pracovní poměr
  position: string // Pracovní pozice
  employment_start: string // Datum nástupu
  employment_end?: string | null // Datum ukončení (null = stále zaměstnán)
  contract_type: 'hpp' | 'dpp' | 'dpc' // HPP, DPP, DPČ

  // Mzda
  wage_type: WageType
  base_salary: number // Základní mzda (měsíční nebo hodinová sazba)
  hourly_rate?: number // Hodinová sazba (pokud wage_type === 'hourly')

  // Pojištění
  health_insurance: HealthInsuranceCode
  social_insurance: boolean // Účast na sociálním pojištění

  // Daně
  tax_declaration: boolean // Má podepsané prohlášení k dani
  tax_bonus_children: number // Počet dětí pro slevu na dani
  disability_level?: 0 | 1 | 2 | 3 // Stupeň invalidity (0 = žádný)
  student: boolean // Je student (sleva na dani)

  // Srážky
  deductions: Deduction[]

  // Zdravotní prohlídka
  medical_exam_due?: string | null // Datum příští lékařské prohlídky

  // Bankovní spojení
  bank_account?: string

  // Poznámky
  notes?: string

  // Metadata
  created_at: string
  updated_at: string
  active: boolean
}

// Helper pro výpočet čisté mzdy (zjednodušený)
export function calculateNetSalary(grossSalary: number, employee: Employee): {
  gross: number
  socialInsurance: number
  healthInsurance: number
  tax: number
  deductionsTotal: number
  net: number
} {
  // Zjednodušený výpočet pro demo
  const socialRate = employee.social_insurance ? 0.065 : 0 // 6.5% zaměstnanec
  const healthRate = 0.045 // 4.5% zaměstnanec

  const socialInsurance = Math.round(grossSalary * socialRate)
  const healthInsurance = Math.round(grossSalary * healthRate)

  // Superhrubá mzda a základ daně (zjednodušeno)
  const taxBase = grossSalary - socialInsurance - healthInsurance
  const taxRate = 0.15 // 15% daň
  const monthlyTaxCredit = 2570 // Sleva na poplatníka 2025
  const childTaxCredit = employee.tax_declaration ? employee.tax_bonus_children * 1267 : 0 // Sleva na dítě

  let tax = Math.round(taxBase * taxRate) - monthlyTaxCredit - childTaxCredit
  if (tax < 0) tax = 0

  // Srážky
  const afterTax = grossSalary - socialInsurance - healthInsurance - tax
  let deductionsTotal = 0

  for (const d of employee.deductions.filter(d => d.active)) {
    if (d.is_percentage) {
      deductionsTotal += Math.round(afterTax * (d.amount / 100))
    } else {
      deductionsTotal += d.amount
    }
  }

  const net = afterTax - deductionsTotal

  return {
    gross: grossSalary,
    socialInsurance,
    healthInsurance,
    tax,
    deductionsTotal,
    net
  }
}

// Labels pro typy srážek
export const DEDUCTION_TYPE_LABELS: Record<DeductionType, string> = {
  exekuce: 'Exekuce',
  alimenty: 'Výživné (alimenty)',
  insolvence: 'Insolvence',
  srazka_zamestnavatel: 'Srážka zaměstnavatele',
  other: 'Jiná srážka',
}

// Labels pro typy pracovního poměru
export const CONTRACT_TYPE_LABELS = {
  hpp: 'Hlavní pracovní poměr',
  dpp: 'Dohoda o provedení práce',
  dpc: 'Dohoda o pracovní činnosti',
}

// Labels pro typ mzdy
export const WAGE_TYPE_LABELS = {
  fixed: 'Fixní měsíční mzda',
  hourly: 'Hodinová mzda',
}
