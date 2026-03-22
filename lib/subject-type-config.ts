/**
 * Subject type configuration for different company/entity types.
 * Determines tax behavior, closure requirements, and UI for:
 * - SRO (s.r.o.) — corporate entity, actual expenses
 * - OSVČ skutečné — self-employed, actual expense tracking
 * - OSVČ paušální — self-employed, flat-rate expenses (60%/80%/40%/30%)
 */

export type SubjectType = 'sro' | 'osvc_actual' | 'osvc_flat_rate'

export type ExpenseType = 'actual' | 'flat_rate'

export interface SubjectTypeConfig {
  label: string
  shortLabel: string
  description: string
  expenseType: ExpenseType
  requiresExpenseTracking: boolean
  requiresBankMatching: boolean
  requiresCashBook: boolean
  vatRelevant: boolean // VAT applies if company is VAT payer
  socialInsuranceRelevant: boolean
  healthInsuranceRelevant: boolean
  flatRatePercent: number | null // null for actual expenses
  closureRequirements: {
    bank_statement: boolean
    expense_invoices: boolean
    income_invoices: boolean
    cash_documents: boolean
  }
  motivationalMessages: {
    documentSaved: string
    monthComplete: string
    yearSummary: string
    noDocNeeded: string
  }
}

const configs: Record<SubjectType, SubjectTypeConfig> = {
  sro: {
    label: 'Společnost s ručením omezeným',
    shortLabel: 's.r.o.',
    description: 'Právnická osoba — skutečné výdaje, daň z příjmu PO 21%',
    expenseType: 'actual',
    requiresExpenseTracking: true,
    requiresBankMatching: true,
    requiresCashBook: true,
    vatRelevant: true,
    socialInsuranceRelevant: false,
    healthInsuranceRelevant: false,
    flatRatePercent: null,
    closureRequirements: {
      bank_statement: true,
      expense_invoices: true,
      income_invoices: true,
      cash_documents: true,
    },
    motivationalMessages: {
      documentSaved: 'Tento doklad snižuje daňový základ vaší firmy',
      monthComplete: 'Měsíc je kompletní — vše připraveno pro účetní',
      yearSummary: 'Celková daňová úspora za rok',
      noDocNeeded: '',
    },
  },
  osvc_actual: {
    label: 'OSVČ — skutečné výdaje',
    shortLabel: 'OSVČ skutečné',
    description: 'Fyzická osoba — skutečné výdaje, daň z příjmu FO 15%',
    expenseType: 'actual',
    requiresExpenseTracking: true,
    requiresBankMatching: true,
    requiresCashBook: true,
    vatRelevant: true,
    socialInsuranceRelevant: true,
    healthInsuranceRelevant: true,
    flatRatePercent: null,
    closureRequirements: {
      bank_statement: true,
      expense_invoices: true,
      income_invoices: true,
      cash_documents: true,
    },
    motivationalMessages: {
      documentSaved: 'Tento doklad vám sníží daň, sociální i zdravotní pojistné',
      monthComplete: 'Výborně! Všechny doklady máte v pořádku',
      yearSummary: 'Celková úspora na dani a pojistném',
      noDocNeeded: '',
    },
  },
  osvc_flat_rate: {
    label: 'OSVČ — paušální výdaje',
    shortLabel: 'OSVČ paušál',
    description: 'Fyzická osoba — paušální výdaje, výdaje se nesledují',
    expenseType: 'flat_rate',
    requiresExpenseTracking: false,
    requiresBankMatching: false,
    requiresCashBook: false,
    vatRelevant: false, // flat-rate OSVČ is typically non-VAT
    socialInsuranceRelevant: true,
    healthInsuranceRelevant: true,
    flatRatePercent: 60, // default 60%, can be overridden per company
    closureRequirements: {
      bank_statement: false,
      expense_invoices: false,
      income_invoices: true, // still need to track income
      cash_documents: false,
    },
    motivationalMessages: {
      documentSaved: 'Evidence příjmu pro přehled',
      monthComplete: 'Příjmy za měsíc evidovány',
      yearSummary: 'Celkové příjmy za rok — paušální výdaje se vypočtou automaticky',
      noDocNeeded: 'Výdajové doklady nejsou potřeba — používáte paušální výdaje',
    },
  },
}

/**
 * Determine SubjectType from company data.
 */
export function getSubjectType(
  legalForm: string,
  expenseType?: string | null
): SubjectType {
  const normalized = (legalForm || '').toLowerCase()

  // SRO and other corporate entities
  if (
    normalized.includes('s.r.o') ||
    normalized.includes('sro') ||
    normalized.includes('a.s') ||
    normalized.includes('v.o.s') ||
    normalized.includes('k.s') ||
    normalized.includes('družstvo') ||
    normalized === '112' || normalized === '121'
  ) {
    return 'sro'
  }

  // OSVČ — check expense type
  if (expenseType === 'flat_rate') return 'osvc_flat_rate'

  return 'osvc_actual'
}

/**
 * Get configuration for a subject type.
 */
export function getSubjectTypeConfig(type: SubjectType): SubjectTypeConfig {
  return configs[type]
}

/**
 * Get config directly from company data.
 */
export function getCompanySubjectConfig(
  legalForm: string,
  expenseType?: string | null
): SubjectTypeConfig {
  return configs[getSubjectType(legalForm, expenseType)]
}

/**
 * Available flat-rate percentages for OSVČ.
 */
export const FLAT_RATE_OPTIONS = [
  { value: 80, label: '80% — řemeslné živnosti, zemědělství' },
  { value: 60, label: '60% — ostatní živnosti (výchozí)' },
  { value: 40, label: '40% — příjmy z jiného podnikání, autorské honoráře' },
  { value: 30, label: '30% — příjmy z pronájmu' },
] as const
