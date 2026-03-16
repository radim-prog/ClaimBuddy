export type CrisisIndustry = 'manufacturing' | 'services' | 'it_saas' | 'retail' | 'construction' | 'logistics' | 'healthcare' | 'agriculture' | 'other'

export type EmployeeRange = '1-5' | '6-20' | '21-50' | '51-200' | '200+'

export type CrisisPlanStatus = 'draft' | 'generated' | 'reviewed' | 'archived'

export interface CrisisPlan {
  id: string
  company_id: string
  created_by: string
  industry: CrisisIndustry
  employee_count_range: EmployeeRange
  annual_revenue_range: string | null
  key_dependencies: string | null
  biggest_fear: string | null
  plan_data: CrisisRiskData[] | null
  plan_generated_at: string | null
  plan_model: string | null
  status: CrisisPlanStatus
  created_at: string
  updated_at: string
  // Joined
  risks?: CrisisPlanRisk[]
}

export interface CrisisPlanRisk {
  id: string
  plan_id: string
  name: string
  category: string
  description: string | null
  severity: number
  occurrence: number
  detection: number
  rpn: number
  action_immediate: string | null
  action_preventive: string | null
  early_warning: string | null
  level_yellow: string | null
  level_red: string | null
  owner: string | null
  sort_order: number
  created_at: string
}

// AI generation input/output
export interface CrisisGenerationInput {
  industry: CrisisIndustry
  employee_count_range: EmployeeRange
  annual_revenue_range?: string
  key_dependencies?: string
  biggest_fear?: string
  company_name?: string
}

export interface CrisisRiskData {
  name: string
  category: string
  description: string
  severity: number
  occurrence: number
  detection: number
  action_immediate: string
  action_preventive: string
  early_warning: string
  level_yellow: string
  level_red: string
}

// Helper functions
export function industryLabel(industry: CrisisIndustry): string {
  const labels: Record<CrisisIndustry, string> = {
    manufacturing: 'Výroba',
    services: 'Služby',
    it_saas: 'IT / SaaS',
    retail: 'Obchod / E-shop',
    construction: 'Stavebnictví',
    logistics: 'Logistika / Doprava',
    healthcare: 'Zdravotnictví',
    agriculture: 'Zemědělství',
    other: 'Ostatní',
  }
  return labels[industry] || industry
}

export function rpnLevel(rpn: number): 'low' | 'medium' | 'high' | 'critical' {
  if (rpn < 50) return 'low'
  if (rpn < 100) return 'medium'
  if (rpn < 200) return 'high'
  return 'critical'
}

export function rpnColor(rpn: number): string {
  const level = rpnLevel(rpn)
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[level]
}

export function rpnLabel(rpn: number): string {
  const level = rpnLevel(rpn)
  const labels: Record<string, string> = {
    low: 'Nízké',
    medium: 'Střední',
    high: 'Vysoké',
    critical: 'Kritické',
  }
  return labels[level]
}

export const CRISIS_CHECKLIST_ITEMS = [
  { id: 'photos', title: 'Vyfotit škodu', description: 'Ze všech úhlů, včetně detailů a celkového pohledu. Ideálně hned, než se cokoliv uklízí.' },
  { id: 'safety', title: 'Zajistit bezpečnost', description: 'Zabránit dalším škodám — odpojit elektřinu, uzavřít vodu, zabezpečit prostor.' },
  { id: 'police', title: 'Zavolat policii (pokud je třeba)', description: 'U krádeže, vandalismu, dopravní nehody. Vyžádat protokol s číslem jednacím.' },
  { id: 'contract', title: 'Najít pojistnou smlouvu', description: 'Zjistit číslo pojistky, co je pojištěno, výši spoluúčasti a limity plnění.' },
  { id: 'report', title: 'Nahlásit pojišťovně', description: 'Do 3 pracovních dnů. Telefonicky + písemně. Zapsat číslo škody.' },
  { id: 'evidence', title: 'Uchovat důkazy', description: 'Nelikvidovat poškozené věci do rozhodnutí pojišťovny. Uchovat účtenky za opravy.' },
  { id: 'timeline', title: 'Sepsat chronologii', description: 'Co se stalo, kdy, jak. Čím dříve, tím přesnější vzpomínky.' },
  { id: 'witnesses', title: 'Zapsat svědky', description: 'Jména a kontakty lidí, kteří byli přítomni nebo mohou potvrdit škodu.' },
  { id: 'professional', title: 'Zvážit odbornou pomoc', description: 'U složitějších případů nebo vyšších škod se vyplatí nechat si pomoci od specialisty.' },
] as const
