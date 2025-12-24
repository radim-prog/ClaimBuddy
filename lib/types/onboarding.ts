// Typy pro onboarding klientů - integrované do klientského profilu

export type ClientStatus = 'onboarding' | 'active'

// Jednotlivé kroky onboardingu
export interface OnboardingStep {
  id: string
  label: string
  description?: string
  required: boolean
  completed: boolean
  completed_at?: string
  completed_by?: string
  notes?: string
  custom?: boolean  // true = uživatelem přidaný krok
  order: number     // pořadí v seznamu
}

// Onboarding data pro klienta
export interface ClientOnboarding {
  status: ClientStatus
  started_at: string
  completed_at?: string
  last_activity_at: string
  assigned_to?: string
  assigned_to_name?: string
  priority: 'high' | 'medium' | 'low'
  steps: OnboardingStep[]
  notes: OnboardingNote[]
  // Speciální případy
  is_new_company_setup?: boolean // Založení nového s.r.o.
  is_restructuring?: boolean // Změna struktury (holding atd.)
  previous_accountant?: string
  takeover_date?: string // Datum převzetí účetnictví
}

export interface OnboardingNote {
  id: string
  content: string
  created_at: string
  created_by: string
  created_by_name?: string
}

// Výchozí kroky onboardingu (bez runtime polí)
export type DefaultOnboardingStep = Omit<OnboardingStep, 'completed' | 'completed_at' | 'completed_by' | 'notes' | 'custom' | 'order'>

export const DEFAULT_ONBOARDING_STEPS: DefaultOnboardingStep[] = [
  {
    id: 'interest',
    label: 'Zájem klienta o službu',
    description: 'Potvrzení zájmu o spolupráci',
    required: true,
  },
  {
    id: 'initial-call',
    label: 'Úvodní call',
    description: 'Telefonický rozhovor s klientem',
    required: false,
  },
  {
    id: 'meeting',
    label: 'Schůzka - zjištění stavu a představ',
    description: 'Osobní nebo online schůzka k projednání detailů',
    required: true,
  },
  {
    id: 'materials-handover',
    label: 'Předání materiálů účetnictví',
    description: 'Převzetí dokumentů od předchozí účetní nebo klienta',
    required: true,
  },
  {
    id: 'data-box-access',
    label: 'Přístup do datové schránky',
    description: 'Získání přístupu do datové schránky klienta',
    required: true,
  },
  {
    id: 'authority-analysis',
    label: 'Analýza úřadů (FÚ, OSSZ, ZP)',
    description: 'Kontrola stavu u finančního úřadu, sociálky a zdravotní pojišťovny',
    required: true,
  },
  {
    id: 'debt-analysis',
    label: 'Analýza dluhů/exekucí',
    description: 'Prověření případných dluhů nebo exekucí',
    required: false,
  },
  {
    id: 'employee-data',
    label: 'Údaje o zaměstnancích',
    description: 'Pojišťovny, výplaty, srážky, exekuce zaměstnanců',
    required: false,
  },
  {
    id: 'profile-complete',
    label: 'Vyplnění klientského profilu',
    description: 'Kompletní vyplnění všech údajů v systému',
    required: true,
  },
  {
    id: 'contract-signed',
    label: 'Podpis smlouvy o spolupráci',
    description: 'Podepsaná smlouva o vedení účetnictví',
    required: true,
  },
  {
    id: 'bank-statements-confirmed',
    label: 'Klient potvrdil zasílání bankovních výpisů',
    description: 'Klient si nastavil automatické zasílání výpisů',
    required: true,
  },
  {
    id: 'calendar-setup',
    label: 'Projít smlouvy → zapsat termíny do diáře',
    description: 'Projít existující smlouvy a zapsat důležité termíny',
    required: true,
  },
  {
    id: 'company-setup',
    label: 'Založení/změna s.r.o. nebo struktury',
    description: 'Založení nové společnosti nebo restrukturalizace',
    required: false,
  },
  {
    id: 'client-training',
    label: 'Školení klienta na systém',
    description: 'Vysvětlení jak nahrávat dokumenty a používat portál',
    required: true,
  },
]

// Helper funkce pro vytvoření nového onboardingu s výchozími kroky
export function createNewOnboarding(assignedTo?: string, assignedToName?: string): ClientOnboarding {
  const now = new Date().toISOString()
  return {
    status: 'onboarding',
    started_at: now,
    last_activity_at: now,
    assigned_to: assignedTo,
    assigned_to_name: assignedToName,
    priority: 'medium',
    steps: DEFAULT_ONBOARDING_STEPS.map((step, index) => ({
      ...step,
      completed: false,
      order: index,
    })),
    notes: [],
  }
}

// Helper funkce pro vytvoření onboardingu s vlastními kroky
export function createOnboardingWithSteps(
  steps: OnboardingStep[],
  assignedTo?: string,
  assignedToName?: string,
  priority: 'high' | 'medium' | 'low' = 'medium'
): ClientOnboarding {
  const now = new Date().toISOString()
  return {
    status: 'onboarding',
    started_at: now,
    last_activity_at: now,
    assigned_to: assignedTo,
    assigned_to_name: assignedToName,
    priority,
    steps: steps.map((step, index) => ({
      ...step,
      order: index,
      completed: step.completed || false,
    })),
    notes: [],
  }
}

// Helper pro výpočet progress
export function calculateOnboardingProgress(steps: OnboardingStep[]): number {
  const requiredSteps = steps.filter(s => s.required)
  const completedRequired = requiredSteps.filter(s => s.completed)
  if (requiredSteps.length === 0) return 100
  return Math.round((completedRequired.length / requiredSteps.length) * 100)
}

// Helper pro kontrolu jestli je onboarding kompletní
export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.filter(s => s.required).every(s => s.completed)
}

// Barvy priorit
export const PRIORITY_CONFIG = {
  high: {
    label: 'Vysoká',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  medium: {
    label: 'Střední',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  low: {
    label: 'Nízká',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
}
