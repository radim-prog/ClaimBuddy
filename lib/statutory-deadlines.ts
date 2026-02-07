// Zákonné termíny pro českou účetní kancelář
// Generuje termíny na základě vlastností klienta (DPH, zaměstnanci, právní forma)

export type DeadlineFrequency = 'monthly' | 'quarterly' | 'annual'

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

// Czech statutory deadline templates
export const STATUTORY_TEMPLATES: StatutoryDeadlineTemplate[] = [
  // === DPH (přiznání + kontrolní hlášení se podávají společně) ===
  {
    id: 'dph-monthly',
    type: 'vat',
    title: 'DPH přiznání + kontrolní hlášení',
    description: 'Podání přiznání k DPH a kontrolního hlášení za předchozí měsíc',
    frequency: 'monthly',
    day_of_month: 25,
    applies_to: { vat_payer: true, vat_period: 'monthly' },
  },
  {
    id: 'dph-quarterly',
    type: 'vat',
    title: 'DPH přiznání + kontrolní hlášení (kvartální)',
    description: 'Podání přiznání k DPH a kontrolního hlášení za předchozí kvartál',
    frequency: 'quarterly',
    day_of_month: 25,
    months: [1, 4, 7, 10],
    applies_to: { vat_payer: true, vat_period: 'quarterly' },
  },

  // === MZDY / ZAMĚSTNANCI (mzdy + odvody = jeden proces) ===
  {
    id: 'mzdy-zpracovani',
    type: 'payroll',
    title: 'Mzdy + odvody OSSZ/ZP',
    description: 'Zpracování mezd, výplatní pásky, odvody sociálního a zdravotního pojištění',
    frequency: 'monthly',
    day_of_month: 20,
    applies_to: { has_employees: true },
  },

  // === DANĚ - ROČNÍ ===
  {
    id: 'dppo',
    type: 'tax',
    title: 'Přiznání k dani z příjmu PO',
    description: 'Podání přiznání k DPPO (s daňovým poradcem do 1.7.)',
    frequency: 'annual',
    day_of_month: 1,
    months: [7],
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
  },
  {
    id: 'dpfo',
    type: 'tax',
    title: 'Přiznání k dani z příjmu FO',
    description: 'Podání přiznání k DPFO (s daňovým poradcem do 1.7.)',
    frequency: 'annual',
    day_of_month: 1,
    months: [7],
    applies_to: { is_osvc: true },
  },

  // === PŘEHLEDY OSVČ (OSSZ + ZP se podávají společně) ===
  {
    id: 'prehledy-osvc',
    type: 'insurance',
    title: 'Přehledy OSSZ + ZP pro OSVČ',
    description: 'Podání přehledů o příjmech a výdajích na OSSZ a ZP',
    frequency: 'annual',
    day_of_month: 2,
    months: [5],
    applies_to: { is_osvc: true },
  },

  // === UZÁVĚRKA ===
  {
    id: 'ucetni-zaverka',
    type: 'closing',
    title: 'Účetní závěrka',
    description: 'Sestavení účetní závěrky a uložení do sbírky listin',
    frequency: 'annual',
    day_of_month: 30,
    months: [6],
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
  },
]

type CompanyForDeadlines = {
  id: string
  name: string
  vat_payer: boolean
  vat_period?: 'monthly' | 'quarterly' | null
  has_employees?: boolean
  legal_form: string
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
