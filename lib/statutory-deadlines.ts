// Zákonné termíny pro českou účetní kancelář
// Generuje termíny na základě vlastností klienta (DPH, zaměstnanci, právní forma)

export type DeadlineFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual'

export type StatutoryDeadlineTemplate = {
  id: string
  type: 'vat' | 'tax' | 'payroll' | 'insurance' | 'reporting' | 'closing'
  title: string
  description: string
  frequency: DeadlineFrequency
  // Day of month (1-31), or specific date for annual
  day_of_month: number
  // Which month(s) for quarterly/annual (1-12)
  months?: number[]
  // Conditions for when this deadline applies
  applies_to: {
    vat_payer?: boolean
    vat_period?: 'monthly' | 'quarterly'
    has_employees?: boolean
    legal_form?: string[] // e.g. ['s.r.o.', 'a.s.'] for legal entities
    is_osvc?: boolean
    has_vehicles?: boolean
    has_property?: boolean
    has_intrastat?: boolean
    has_tax_advisor?: boolean
    tax_advance_period?: 'quarterly' | 'semi-annual'
  }
}

export type GeneratedDeadline = {
  id: string
  template_id: string
  company_id: string
  company_name: string
  type: StatutoryDeadlineTemplate['type']
  title: string
  description: string
  due_date: string // YYYY-MM-DD
  completed: boolean
  completed_at?: string
  completed_by?: string
}

// Czech statutory deadline templates — complete list for accounting firms
export const STATUTORY_TEMPLATES: StatutoryDeadlineTemplate[] = [
  // === DPH (VAT) ===
  {
    id: 'dph-monthly',
    type: 'vat',
    title: 'DPH přiznání (měsíční)',
    description: 'Podání přiznání k DPH za předchozí měsíc',
    frequency: 'monthly',
    day_of_month: 25,
    applies_to: { vat_payer: true, vat_period: 'monthly' },
  },
  {
    id: 'dph-quarterly',
    type: 'vat',
    title: 'DPH přiznání (čtvrtletní)',
    description: 'Podání přiznání k DPH za předchozí čtvrtletí',
    frequency: 'quarterly',
    day_of_month: 25,
    months: [1, 4, 7, 10],
    applies_to: { vat_payer: true, vat_period: 'quarterly' },
  },

  // === KONTROLNÍ HLÁŠENÍ ===
  {
    id: 'kh-monthly',
    type: 'vat',
    title: 'Kontrolní hlášení (měsíční)',
    description: 'Kontrolní hlášení k DPH — právnické osoby podávají měsíčně',
    frequency: 'monthly',
    day_of_month: 25,
    applies_to: { vat_payer: true, vat_period: 'monthly', legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
  },
  {
    id: 'kh-quarterly',
    type: 'vat',
    title: 'Kontrolní hlášení (čtvrtletní)',
    description: 'Kontrolní hlášení k DPH — FO plátci podávají čtvrtletně',
    frequency: 'quarterly',
    day_of_month: 25,
    months: [1, 4, 7, 10],
    applies_to: { vat_payer: true, vat_period: 'quarterly', is_osvc: true },
  },

  // === SOUHRNNÉ HLÁŠENÍ ===
  {
    id: 'sh-monthly',
    type: 'vat',
    title: 'Souhrnné hlášení (měsíční)',
    description: 'Souhrnné hlášení k DPH za dodání zboží/služeb do EU',
    frequency: 'monthly',
    day_of_month: 25,
    applies_to: { vat_payer: true, vat_period: 'monthly' },
  },
  {
    id: 'sh-quarterly',
    type: 'vat',
    title: 'Souhrnné hlášení (čtvrtletní)',
    description: 'Souhrnné hlášení k DPH za dodání zboží/služeb do EU',
    frequency: 'quarterly',
    day_of_month: 25,
    months: [1, 4, 7, 10],
    applies_to: { vat_payer: true, vat_period: 'quarterly' },
  },

  // === ZÁLOHY POJISTNÉ OSVČ ===
  {
    id: 'sp-zaloha-osvc',
    type: 'insurance',
    title: 'Záloha SP (OSVČ)',
    description: 'Měsíční záloha na sociální pojištění OSVČ — splatnost do posledního dne měsíce',
    frequency: 'monthly',
    day_of_month: 28, // last business day approximation
    applies_to: { is_osvc: true },
  },
  {
    id: 'zp-zaloha-osvc',
    type: 'insurance',
    title: 'Záloha ZP (OSVČ)',
    description: 'Měsíční záloha na zdravotní pojištění OSVČ — splatnost do 8. dne následujícího měsíce',
    frequency: 'monthly',
    day_of_month: 8,
    applies_to: { is_osvc: true },
  },

  // === MZDY / ZAMĚSTNANCI ===
  {
    id: 'mzdy-zpracovani',
    type: 'payroll',
    title: 'Mzdy + odvody OSSZ/ZP',
    description: 'Zpracování mezd, výplatní pásky, odvody sociálního a zdravotního pojištění',
    frequency: 'monthly',
    day_of_month: 20,
    applies_to: { has_employees: true },
  },
  {
    id: 'dohody-vyplata',
    type: 'payroll',
    title: 'Výplata DPP/DPČ',
    description: 'Výplata odměn za DPP/DPČ za předchozí měsíc, odvody srážkové daně do 20. dne',
    frequency: 'monthly',
    day_of_month: 20,
    applies_to: { has_employees: true },
  },

  // === DAŇ Z PŘÍJMU PO ===
  {
    id: 'dppo-bez-poradce',
    type: 'tax',
    title: 'Přiznání k DPPO (bez poradce)',
    description: 'Podání přiznání k dani z příjmu právnických osob — bez daňového poradce',
    frequency: 'annual',
    day_of_month: 1,
    months: [4],
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'], has_tax_advisor: false },
  },
  {
    id: 'dppo-s-poradcem',
    type: 'tax',
    title: 'Přiznání k DPPO (s poradcem)',
    description: 'Podání přiznání k dani z příjmu právnických osob — s daňovým poradcem',
    frequency: 'annual',
    day_of_month: 1,
    months: [7],
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'], has_tax_advisor: true },
  },

  // === DAŇ Z PŘÍJMU FO ===
  {
    id: 'dpfo-bez-poradce',
    type: 'tax',
    title: 'Přiznání k DPFO (bez poradce)',
    description: 'Podání přiznání k dani z příjmu fyzických osob — bez daňového poradce',
    frequency: 'annual',
    day_of_month: 1,
    months: [4],
    applies_to: { is_osvc: true, has_tax_advisor: false },
  },
  {
    id: 'dpfo-s-poradcem',
    type: 'tax',
    title: 'Přiznání k DPFO (s poradcem)',
    description: 'Podání přiznání k dani z příjmu fyzických osob — s daňovým poradcem',
    frequency: 'annual',
    day_of_month: 1,
    months: [7],
    applies_to: { is_osvc: true, has_tax_advisor: true },
  },

  // === PŘEHLEDY OSSZ ===
  {
    id: 'prehled-ossz-bez-poradce',
    type: 'insurance',
    title: 'Přehled OSSZ (bez poradce)',
    description: 'Přehled o příjmech a výdajích OSVČ pro OSSZ',
    frequency: 'annual',
    day_of_month: 2,
    months: [5],
    applies_to: { is_osvc: true, has_tax_advisor: false },
  },
  {
    id: 'prehled-ossz-s-poradcem',
    type: 'insurance',
    title: 'Přehled OSSZ (s poradcem)',
    description: 'Přehled o příjmech a výdajích OSVČ pro OSSZ — prodloužený termín',
    frequency: 'annual',
    day_of_month: 1,
    months: [8],
    applies_to: { is_osvc: true, has_tax_advisor: true },
  },

  // === PŘEHLEDY ZP ===
  {
    id: 'prehled-zp-bez-poradce',
    type: 'insurance',
    title: 'Přehled ZP (bez poradce)',
    description: 'Přehled o příjmech a výdajích OSVČ pro zdravotní pojišťovnu',
    frequency: 'annual',
    day_of_month: 2,
    months: [5],
    applies_to: { is_osvc: true, has_tax_advisor: false },
  },
  {
    id: 'prehled-zp-s-poradcem',
    type: 'insurance',
    title: 'Přehled ZP (s poradcem)',
    description: 'Přehled o příjmech a výdajích OSVČ pro ZP — prodloužený termín',
    frequency: 'annual',
    day_of_month: 1,
    months: [8],
    applies_to: { is_osvc: true, has_tax_advisor: true },
  },

  // === SILNIČNÍ DAŇ ===
  {
    id: 'silnicni-dan-priznani',
    type: 'tax',
    title: 'Přiznání k silniční dani',
    description: 'Podání přiznání k dani silniční za předchozí rok',
    frequency: 'annual',
    day_of_month: 31,
    months: [1],
    applies_to: { has_vehicles: true },
  },
  {
    id: 'silnicni-dan-z1',
    type: 'tax',
    title: 'Záloha silniční daň (Q1)',
    description: 'Záloha na silniční daň za leden–březen',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [4],
    applies_to: { has_vehicles: true },
  },
  {
    id: 'silnicni-dan-z2',
    type: 'tax',
    title: 'Záloha silniční daň (Q2)',
    description: 'Záloha na silniční daň za duben–červen',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [7],
    applies_to: { has_vehicles: true },
  },
  {
    id: 'silnicni-dan-z3',
    type: 'tax',
    title: 'Záloha silniční daň (Q3)',
    description: 'Záloha na silniční daň za červenec–září',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [10],
    applies_to: { has_vehicles: true },
  },
  {
    id: 'silnicni-dan-z4',
    type: 'tax',
    title: 'Záloha silniční daň (Q4)',
    description: 'Záloha na silniční daň za říjen–listopad',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [12],
    applies_to: { has_vehicles: true },
  },

  // === DAŇ Z NEMOVITOSTI ===
  {
    id: 'dan-nemovitosti',
    type: 'tax',
    title: 'Přiznání k dani z nemovitosti',
    description: 'Podání přiznání k dani z nemovitých věcí (při změně oproti minulému roku)',
    frequency: 'annual',
    day_of_month: 31,
    months: [1],
    applies_to: { has_property: true },
  },

  // === ZÁLOHY NA DAŇ Z PŘÍJMU ===
  {
    id: 'zaloha-dan-q1',
    type: 'tax',
    title: 'Záloha daň z příjmu (Q1)',
    description: 'Čtvrtletní záloha na daň z příjmu',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [3],
    applies_to: { tax_advance_period: 'quarterly' },
  },
  {
    id: 'zaloha-dan-q2',
    type: 'tax',
    title: 'Záloha daň z příjmu (Q2)',
    description: 'Čtvrtletní záloha na daň z příjmu',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [6],
    applies_to: { tax_advance_period: 'quarterly' },
  },
  {
    id: 'zaloha-dan-q3',
    type: 'tax',
    title: 'Záloha daň z příjmu (Q3)',
    description: 'Čtvrtletní záloha na daň z příjmu',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [9],
    applies_to: { tax_advance_period: 'quarterly' },
  },
  {
    id: 'zaloha-dan-q4',
    type: 'tax',
    title: 'Záloha daň z příjmu (Q4)',
    description: 'Čtvrtletní záloha na daň z příjmu',
    frequency: 'quarterly',
    day_of_month: 15,
    months: [12],
    applies_to: { tax_advance_period: 'quarterly' },
  },
  {
    id: 'zaloha-dan-h1',
    type: 'tax',
    title: 'Záloha daň z příjmu (1. pololetí)',
    description: 'Pololetní záloha na daň z příjmu',
    frequency: 'semi-annual',
    day_of_month: 15,
    months: [6],
    applies_to: { tax_advance_period: 'semi-annual' },
  },
  {
    id: 'zaloha-dan-h2',
    type: 'tax',
    title: 'Záloha daň z příjmu (2. pololetí)',
    description: 'Pololetní záloha na daň z příjmu',
    frequency: 'semi-annual',
    day_of_month: 15,
    months: [12],
    applies_to: { tax_advance_period: 'semi-annual' },
  },

  // === INTRASTAT ===
  {
    id: 'intrastat',
    type: 'reporting',
    title: 'Intrastat hlášení',
    description: 'Měsíční hlášení Intrastat (do 12. pracovního dne následujícího měsíce)',
    frequency: 'monthly',
    day_of_month: 18, // ~12th business day
    applies_to: { has_intrastat: true },
  },

  // === VYÚČTOVÁNÍ DANĚ ===
  {
    id: 'vyuctovani-zavislacin',
    type: 'tax',
    title: 'Vyúčtování daně ze závislé činnosti',
    description: 'Roční vyúčtování daně ze závislé činnosti zaměstnanců',
    frequency: 'annual',
    day_of_month: 1,
    months: [3],
    applies_to: { has_employees: true },
  },
  {
    id: 'vyuctovani-srazkova',
    type: 'tax',
    title: 'Vyúčtování srážkové daně',
    description: 'Roční vyúčtování srážkové daně',
    frequency: 'annual',
    day_of_month: 1,
    months: [4],
    applies_to: { has_employees: true },
  },

  // === ÚČETNÍ ZÁVĚRKA ===
  {
    id: 'ucetni-zaverka-po',
    type: 'closing',
    title: 'Účetní závěrka (PO)',
    description: 'Sestavení účetní závěrky a uložení do sbírky listin',
    frequency: 'annual',
    day_of_month: 30,
    months: [6],
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
  },
  {
    id: 'ucetni-zaverka-fo-bez-poradce',
    type: 'closing',
    title: 'Uzávěrka FO (bez poradce)',
    description: 'Uzavření účetních knih a přiznání OSVČ',
    frequency: 'annual',
    day_of_month: 1,
    months: [4],
    applies_to: { is_osvc: true, has_tax_advisor: false },
  },
  {
    id: 'ucetni-zaverka-fo-s-poradcem',
    type: 'closing',
    title: 'Uzávěrka FO (s poradcem)',
    description: 'Uzavření účetních knih a přiznání OSVČ — prodloužený termín',
    frequency: 'annual',
    day_of_month: 1,
    months: [7],
    applies_to: { is_osvc: true, has_tax_advisor: true },
  },
]

type CompanyForDeadlines = {
  id: string
  name: string
  vat_payer: boolean
  vat_period?: 'monthly' | 'quarterly' | null
  has_employees?: boolean
  legal_form: string
  has_vehicles?: boolean
  has_property?: boolean
  has_intrastat?: boolean
  has_tax_advisor?: boolean
  tax_advance_period?: 'quarterly' | 'semi-annual' | null
}

function matchesTemplate(company: CompanyForDeadlines, template: StatutoryDeadlineTemplate): boolean {
  const { applies_to } = template

  if (applies_to.vat_payer !== undefined && company.vat_payer !== applies_to.vat_payer) {
    return false
  }

  if (applies_to.vat_period && company.vat_period !== applies_to.vat_period) {
    return false
  }

  if (applies_to.has_employees !== undefined && (company.has_employees || false) !== applies_to.has_employees) {
    return false
  }

  if (applies_to.legal_form && !applies_to.legal_form.includes(company.legal_form)) {
    return false
  }

  if (applies_to.is_osvc !== undefined) {
    const isOsvc = company.legal_form === 'OSVČ'
    if (applies_to.is_osvc !== isOsvc) return false
  }

  if (applies_to.has_vehicles !== undefined && (company.has_vehicles || false) !== applies_to.has_vehicles) {
    return false
  }

  if (applies_to.has_property !== undefined && (company.has_property || false) !== applies_to.has_property) {
    return false
  }

  if (applies_to.has_intrastat !== undefined && (company.has_intrastat || false) !== applies_to.has_intrastat) {
    return false
  }

  if (applies_to.has_tax_advisor !== undefined && (company.has_tax_advisor || false) !== applies_to.has_tax_advisor) {
    return false
  }

  if (applies_to.tax_advance_period && company.tax_advance_period !== applies_to.tax_advance_period) {
    return false
  }

  return true
}

export function generateDeadlinesForCompany(
  company: CompanyForDeadlines,
  year: number,
  month: number // 1-indexed
): GeneratedDeadline[] {
  const deadlines: GeneratedDeadline[] = []

  STATUTORY_TEMPLATES.forEach(template => {
    if (!matchesTemplate(company, template)) return

    if (template.frequency === 'monthly') {
      // Generate for the specified month
      const dueDate = new Date(year, month - 1, template.day_of_month)
      // Adjust if day doesn't exist in the month
      if (dueDate.getMonth() !== month - 1) {
        dueDate.setDate(0) // Last day of previous month
      }

      deadlines.push({
        id: `${template.id}-${company.id}-${year}-${String(month).padStart(2, '0')}`,
        template_id: template.id,
        company_id: company.id,
        company_name: company.name,
        type: template.type,
        title: template.title,
        description: template.description,
        due_date: dueDate.toISOString().split('T')[0],
        completed: false,
      })
    } else if (template.frequency === 'quarterly') {
      // Only generate if this month is a quarter boundary
      if (template.months?.includes(month)) {
        const dueDate = new Date(year, month - 1, template.day_of_month)
        if (dueDate.getMonth() !== month - 1) {
          dueDate.setDate(0)
        }

        deadlines.push({
          id: `${template.id}-${company.id}-${year}-Q${Math.ceil(month / 3)}`,
          template_id: template.id,
          company_id: company.id,
          company_name: company.name,
          type: template.type,
          title: template.title,
          description: template.description,
          due_date: dueDate.toISOString().split('T')[0],
          completed: false,
        })
      }
    } else if (template.frequency === 'semi-annual') {
      if (template.months?.includes(month)) {
        const dueDate = new Date(year, month - 1, template.day_of_month)
        if (dueDate.getMonth() !== month - 1) {
          dueDate.setDate(0)
        }
        const half = month <= 6 ? 'H1' : 'H2'
        deadlines.push({
          id: `${template.id}-${company.id}-${year}-${half}`,
          template_id: template.id,
          company_id: company.id,
          company_name: company.name,
          type: template.type,
          title: template.title,
          description: template.description,
          due_date: dueDate.toISOString().split('T')[0],
          completed: false,
        })
      }
    } else if (template.frequency === 'annual') {
      if (template.months?.includes(month)) {
        const dueDate = new Date(year, month - 1, template.day_of_month)
        if (dueDate.getMonth() !== month - 1) {
          dueDate.setDate(0)
        }

        deadlines.push({
          id: `${template.id}-${company.id}-${year}`,
          template_id: template.id,
          company_id: company.id,
          company_name: company.name,
          type: template.type,
          title: template.title,
          description: template.description,
          due_date: dueDate.toISOString().split('T')[0],
          completed: false,
        })
      }
    }
  })

  return deadlines
}

export function generateAllDeadlines(
  companies: CompanyForDeadlines[],
  year: number,
  month: number
): GeneratedDeadline[] {
  return companies.flatMap(company => generateDeadlinesForCompany(company, year, month))
}

// Get type label in Czech
export function getDeadlineTypeLabel(type: StatutoryDeadlineTemplate['type']): string {
  const labels: Record<string, string> = {
    vat: 'DPH',
    tax: 'Daně',
    payroll: 'Mzdy',
    insurance: 'Pojištění',
    reporting: 'Výkaznictví',
    closing: 'Uzávěrka',
  }
  return labels[type] || type
}

// Get type color
export function getDeadlineTypeColor(type: StatutoryDeadlineTemplate['type']): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    vat: { bg: 'bg-blue-100', text: 'text-blue-700' },
    tax: { bg: 'bg-purple-100', text: 'text-purple-700' },
    payroll: { bg: 'bg-green-100', text: 'text-green-700' },
    insurance: { bg: 'bg-orange-100', text: 'text-orange-700' },
    reporting: { bg: 'bg-gray-100', text: 'text-gray-700' },
    closing: { bg: 'bg-red-100', text: 'text-red-700' },
  }
  return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-700' }
}
