// Šablony opakujících se úkolů pro účetní kancelář
// Generuje měsíční/kvartální/roční úkoly na základě vlastností klienta

import type { Task, TaskStatus, BillingType } from '@/lib/mock-data'

export type TemplateFrequency = 'monthly' | 'quarterly' | 'annual'

export type TaskTemplate = {
  id: string
  title: string
  description: string
  frequency: TemplateFrequency
  // Day of month for the due date (1-28)
  due_day: number
  // For quarterly/annual: which months (1-12)
  months?: number[]
  // Estimated time in minutes
  estimated_minutes: number
  // Billing
  billing_type: BillingType
  is_billable: boolean
  // Conditions for which companies this applies to
  applies_to: {
    vat_payer?: boolean
    vat_period?: 'monthly' | 'quarterly'
    has_employees?: boolean
    legal_form?: string[] // e.g. ['s.r.o.', 'a.s.']
    is_osvc?: boolean
    status?: 'active' // only active companies
  }
  // Tags for categorization
  tags: string[]
}

// Šablony pro českou účetní kancelář
export const TASK_TEMPLATES: TaskTemplate[] = [
  // === MĚSÍČNÍ ÚKOLY (pro všechny aktivní firmy) ===
  {
    id: 'tpl-bank-statements',
    title: 'Zpracování bankovních výpisů',
    description: 'Stáhnout a zaúčtovat bankovní výpisy za předchozí měsíc',
    frequency: 'monthly',
    due_day: 10,
    estimated_minutes: 30,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { status: 'active' },
    tags: ['měsíční', 'banka'],
  },
  {
    id: 'tpl-expense-invoices',
    title: 'Zpracování přijatých faktur',
    description: 'Zaúčtovat přijaté faktury (náklady) za předchozí měsíc',
    frequency: 'monthly',
    due_day: 12,
    estimated_minutes: 45,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { status: 'active' },
    tags: ['měsíční', 'náklady'],
  },
  {
    id: 'tpl-income-invoices',
    title: 'Zpracování vydaných faktur',
    description: 'Zaúčtovat vydané faktury (příjmy) za předchozí měsíc',
    frequency: 'monthly',
    due_day: 12,
    estimated_minutes: 30,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { status: 'active' },
    tags: ['měsíční', 'příjmy'],
  },

  // === DPH (měsíční plátci) ===
  {
    id: 'tpl-dph-monthly',
    title: 'DPH přiznání + kontrolní hlášení',
    description: 'Sestavit a podat přiznání k DPH a kontrolní hlášení za předchozí měsíc',
    frequency: 'monthly',
    due_day: 24, // Deadline 25., úkol den předem
    estimated_minutes: 60,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { vat_payer: true, vat_period: 'monthly' },
    tags: ['DPH', 'měsíční'],
  },

  // === DPH (kvartální plátci) ===
  {
    id: 'tpl-dph-quarterly',
    title: 'DPH přiznání + kontrolní hlášení (kvartální)',
    description: 'Sestavit a podat přiznání k DPH a kontrolní hlášení za předchozí kvartál',
    frequency: 'quarterly',
    due_day: 24,
    months: [1, 4, 7, 10],
    estimated_minutes: 90,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { vat_payer: true, vat_period: 'quarterly' },
    tags: ['DPH', 'kvartální'],
  },

  // === MZDY ===
  {
    id: 'tpl-payroll',
    title: 'Zpracování mezd + odvody',
    description: 'Zpracovat mzdy, výplatní pásky, odvody OSSZ a ZP',
    frequency: 'monthly',
    due_day: 19, // Deadline 20., úkol den předem
    estimated_minutes: 90,
    billing_type: 'tariff',
    is_billable: true,
    applies_to: { has_employees: true },
    tags: ['mzdy', 'měsíční'],
  },

  // === ROČNÍ - DPPO ===
  {
    id: 'tpl-dppo',
    title: 'Přiznání k dani z příjmu PO',
    description: 'Sestavit a podat přiznání k DPPO (s daňovým poradcem do 1.7.)',
    frequency: 'annual',
    due_day: 15,
    months: [6], // Červen - s dostatečným předstihem
    estimated_minutes: 240,
    billing_type: 'extra',
    is_billable: true,
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
    tags: ['daně', 'roční'],
  },

  // === ROČNÍ - DPFO ===
  {
    id: 'tpl-dpfo',
    title: 'Přiznání k dani z příjmu FO',
    description: 'Sestavit a podat přiznání k DPFO (s daňovým poradcem do 1.7.)',
    frequency: 'annual',
    due_day: 15,
    months: [6],
    estimated_minutes: 180,
    billing_type: 'extra',
    is_billable: true,
    applies_to: { is_osvc: true },
    tags: ['daně', 'roční'],
  },

  // === ROČNÍ - Přehledy OSVČ ===
  {
    id: 'tpl-osvc-reports',
    title: 'Přehledy OSSZ + ZP pro OSVČ',
    description: 'Podání přehledů o příjmech a výdajích na OSSZ a ZP',
    frequency: 'annual',
    due_day: 25,
    months: [4], // Duben
    estimated_minutes: 120,
    billing_type: 'extra',
    is_billable: true,
    applies_to: { is_osvc: true },
    tags: ['pojištění', 'roční'],
  },

  // === ROČNÍ - Účetní závěrka ===
  {
    id: 'tpl-annual-closing',
    title: 'Účetní závěrka',
    description: 'Sestavení účetní závěrky a uložení do sbírky listin',
    frequency: 'annual',
    due_day: 20,
    months: [6],
    estimated_minutes: 360,
    billing_type: 'extra',
    is_billable: true,
    applies_to: { legal_form: ['s.r.o.', 'a.s.', 'v.o.s.', 'k.s.', 'z.s.', 'družstvo'] },
    tags: ['uzávěrka', 'roční'],
  },
]

type CompanyForTemplates = {
  id: string
  name: string
  status: string
  vat_payer: boolean
  vat_period?: 'monthly' | 'quarterly' | null
  has_employees?: boolean
  legal_form: string
}

function matchesTemplate(company: CompanyForTemplates, template: TaskTemplate): boolean {
  const { applies_to } = template

  if (applies_to.status === 'active' && company.status !== 'active') {
    return false
  }

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

// Label for the period a task covers (previous month)
function getTaskPeriodLabel(year: number, month: number): string {
  // Tasks in month M are for period M-1
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const monthNames = ['', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
  return `${monthNames[prevMonth]} ${prevYear}`
}

// Generate tasks from templates for a specific company + month
export function generateTasksForCompany(
  company: CompanyForTemplates,
  year: number,
  month: number, // 1-indexed, the month IN which tasks are created
  createdBy: { id: string; name: string } = { id: 'system', name: 'Systém' }
): Task[] {
  const tasks: Task[] = []
  const periodLabel = getTaskPeriodLabel(year, month)
  const period = `${year}-${String(month).padStart(2, '0')}`

  TASK_TEMPLATES.forEach(template => {
    if (!matchesTemplate(company, template)) return

    // Check frequency
    if (template.frequency === 'quarterly' && !template.months?.includes(month)) return
    if (template.frequency === 'annual' && !template.months?.includes(month)) return

    // Calculate due date
    const dueDate = new Date(year, month - 1, template.due_day)
    if (dueDate.getMonth() !== month - 1) {
      dueDate.setDate(0) // Last day of month if day doesn't exist
    }
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const taskId = `${template.id}-${company.id}-${period}`

    const titleSuffix = template.frequency === 'monthly'
      ? ` (${periodLabel})`
      : template.frequency === 'quarterly'
        ? ` (Q${Math.ceil(month / 3)} ${year})`
        : ` (${year})`

    tasks.push({
      id: taskId,
      title: `${template.title}${titleSuffix}`,
      description: template.description,
      is_project: false,
      status: 'pending' as TaskStatus,
      task_type: 'base',
      created_by: createdBy.id,
      created_by_name: createdBy.name,
      assigned_to: createdBy.id,
      assigned_to_name: createdBy.name,
      is_waiting_for: false,
      due_date: dueDateStr,
      company_id: company.id,
      company_name: company.name,
      estimated_minutes: template.estimated_minutes,
      is_billable: template.is_billable,
      billing_type: template.billing_type,
      tags: [...template.tags, `period:${period}`],
      gtd_context: ['@pocitac'] as any,
      gtd_energy_level: 'medium' as any,
      gtd_is_quick_action: template.estimated_minutes <= 15,
      created_at: new Date(year, month - 1, 1).toISOString(),
      updated_at: new Date(year, month - 1, 1).toISOString(),
    })
  })

  return tasks
}

// Generate all tasks for all companies for a given month
export function generateAllTasks(
  year: number,
  month: number,
  companies: CompanyForTemplates[],
  createdBy?: { id: string; name: string }
): Task[] {
  const activeCompanies = companies.filter(c => c.status === 'active')
  return activeCompanies.flatMap(company => generateTasksForCompany(company, year, month, createdBy))
}

// Get task count preview per template for active companies
export function getTemplatePreview(
  companies: CompanyForTemplates[]
): Array<{ template: TaskTemplate; matchingCompanies: number }> {
  const activeCompanies = companies.filter(c => c.status === 'active')
  return TASK_TEMPLATES.map(template => ({
    template,
    matchingCompanies: activeCompanies.filter(c => matchesTemplate(c, template)).length,
  }))
}

// Check if tasks were already generated for a period
export function getExistingTasksForPeriod(existingTasks: Task[], period: string): number {
  return existingTasks.filter(t => t.tags?.includes(`period:${period}`)).length
}

// Get frequency label in Czech
export function getFrequencyLabel(freq: TemplateFrequency): string {
  const labels: Record<TemplateFrequency, string> = {
    monthly: 'Měsíčně',
    quarterly: 'Kvartálně',
    annual: 'Ročně',
  }
  return labels[freq]
}
