// ============================================
// ANNUAL CLOSING (Roční uzávěrka) - TypeScript Types
// ============================================

export type AnnualClosingStepStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable'

export interface AnnualClosingStep {
  id: string
  title: string
  description: string
  status: AnnualClosingStepStatus
  completed_by?: string
  completed_at?: string
  notes?: string
  order: number
}

export interface AnnualClosingChecklist {
  company_id: string
  company_name: string
  year: number
  steps: AnnualClosingStep[]
  created_at: string
  updated_at: string
}

// Default steps for annual closing checklist
export const DEFAULT_ANNUAL_CLOSING_STEPS: Omit<AnnualClosingStep, 'id'>[] = [
  {
    title: 'Inventura majetku',
    description: 'Inventarizace hmotného a nehmotného majetku, porovnání se skladovou evidencí.',
    status: 'not_started',
    order: 1,
  },
  {
    title: 'Inventura závazků a pohledávek',
    description: 'Odsouhlasení salda s dodavateli a odběrateli, vyhodnocení nedobytných pohledávek.',
    status: 'not_started',
    order: 2,
  },
  {
    title: 'Účetní odpisy',
    description: 'Výpočet a zaúčtování účetních odpisů dlouhodobého majetku.',
    status: 'not_started',
    order: 3,
  },
  {
    title: 'Daňové odpisy',
    description: 'Výpočet daňových odpisů dle ZDP, volba metody odpisování.',
    status: 'not_started',
    order: 4,
  },
  {
    title: 'Kurzové rozdíly',
    description: 'Přepočet cizoměnových pohledávek a závazků kurzem ČNB k 31.12.',
    status: 'not_started',
    order: 5,
  },
  {
    title: 'Časové rozlišení',
    description: 'Zaúčtování nákladů a výnosů příštích období, příjmů a výdajů příštích období.',
    status: 'not_started',
    order: 6,
  },
  {
    title: 'Dohadné položky',
    description: 'Zaúčtování dohadných položek aktivních a pasivních.',
    status: 'not_started',
    order: 7,
  },
  {
    title: 'Tvorba/rozpuštění rezerv',
    description: 'Posouzení a zaúčtování zákonných a účetních rezerv.',
    status: 'not_started',
    order: 8,
  },
  {
    title: 'Daňová analýza',
    description: 'Výpočet daňového základu, identifikace daňově neuznatelných nákladů, optimalizace.',
    status: 'not_started',
    order: 9,
  },
  {
    title: 'Účetní závěrka',
    description: 'Sestavení rozvahy, výkazu zisku a ztráty, přílohy k účetní závěrce.',
    status: 'not_started',
    order: 10,
  },
  {
    title: 'Daňové přiznání',
    description: 'Sestavení a kontrola přiznání k dani z příjmů (DPPO/DPFO).',
    status: 'not_started',
    order: 11,
  },
  {
    title: 'Podání na FÚ',
    description: 'Elektronické podání daňového přiznání a účetní závěrky na finanční úřad.',
    status: 'not_started',
    order: 12,
  },
]

// In-memory store for annual closing checklists
const annualClosingStore: AnnualClosingChecklist[] = []

export function getAnnualClosingForCompany(companyId: string, year: number): AnnualClosingChecklist | undefined {
  return annualClosingStore.find(ac => ac.company_id === companyId && ac.year === year)
}

export function getAllAnnualClosings(year: number): AnnualClosingChecklist[] {
  return annualClosingStore.filter(ac => ac.year === year)
}

export function createAnnualClosing(companyId: string, companyName: string, year: number): AnnualClosingChecklist {
  const existing = getAnnualClosingForCompany(companyId, year)
  if (existing) return existing

  const checklist: AnnualClosingChecklist = {
    company_id: companyId,
    company_name: companyName,
    year,
    steps: DEFAULT_ANNUAL_CLOSING_STEPS.map((step, index) => ({
      ...step,
      id: `step-${companyId}-${year}-${index + 1}`,
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  annualClosingStore.push(checklist)
  return checklist
}

export function updateAnnualClosingStep(
  companyId: string,
  year: number,
  stepId: string,
  update: Partial<Pick<AnnualClosingStep, 'status' | 'notes' | 'completed_by' | 'completed_at'>>
): AnnualClosingChecklist | undefined {
  const checklist = getAnnualClosingForCompany(companyId, year)
  if (!checklist) return undefined

  const step = checklist.steps.find(s => s.id === stepId)
  if (!step) return undefined

  Object.assign(step, update)
  checklist.updated_at = new Date().toISOString()
  return checklist
}

export function initAnnualClosingsForCompanies(
  companies: { id: string; name: string; status: string }[],
  year: number
): AnnualClosingChecklist[] {
  const activeCompanies = companies.filter(c => c.status === 'active')
  for (const company of activeCompanies) {
    createAnnualClosing(company.id, company.name, year)
  }
  return getAllAnnualClosings(year)
}

export function getAnnualClosingProgress(checklist: AnnualClosingChecklist): {
  total: number
  completed: number
  inProgress: number
  percentage: number
} {
  const applicable = checklist.steps.filter(s => s.status !== 'not_applicable')
  const completed = applicable.filter(s => s.status === 'completed').length
  const inProgress = applicable.filter(s => s.status === 'in_progress').length
  return {
    total: applicable.length,
    completed,
    inProgress,
    percentage: applicable.length > 0 ? Math.round((completed / applicable.length) * 100) : 0,
  }
}
