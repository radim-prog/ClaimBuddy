// Tax questionnaire definition — questions, sections, conditional logic

export type QuestionType = 'yesno' | 'text' | 'select' | 'children'

export interface Question {
  id: string
  label: string
  type: QuestionType
  required?: boolean
  conditionalOn?: string // show only when this question id = 'yes'
  placeholder?: string
  options?: { value: string; label: string }[] // for select type
}

export interface Section {
  id: string
  title: string
  icon: string
  questions: Question[]
  allowDocUpload?: boolean
  uploadHint?: string
}

export type QuestionnaireResponses = Record<string, string | boolean | ChildEntry[] | null>

export interface ChildEntry {
  name: string
  birth_number: string
}

export const HEALTH_INSURANCE_OPTIONS = [
  { value: 'vzp', label: '111 — VZP' },
  { value: 'vozp', label: '201 — VoZP' },
  { value: 'cpzp', label: '205 — ČPZP' },
  { value: 'ozp', label: '207 — OZP' },
  { value: 'zpmv', label: '211 — ZP MV' },
  { value: 'rbp', label: '213 — RBP' },
  { value: 'zpma', label: '217 — ZP M-A' },
]

export const TAX_QUESTIONNAIRE_SECTIONS: Section[] = [
  {
    id: 'income',
    title: 'Příjmy',
    icon: 'banknote',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o příjmech, výpisy z investičních platforem',
    questions: [
      { id: 'income_employment', label: 'Příjmy ze závislé činnosti (pracovní poměr/brigády)?', type: 'yesno' },
      { id: 'income_business', label: 'Příjmy z podnikání?', type: 'yesno' },
      { id: 'income_capital', label: 'Příjmy z kapitálového majetku (úroky, dividendy, participace)?', type: 'yesno' },
      { id: 'income_rent', label: 'Příjmy z nájmu?', type: 'yesno' },
      { id: 'income_property_sale', label: 'Příjmy z prodeje majetku (nemovitost, vozidlo)?', type: 'yesno' },
      { id: 'income_securities', label: 'Příjmy z prodeje cenných papírů?', type: 'yesno' },
      { id: 'income_trading', label: 'Příjmy z tradingu (forex, deriváty, krypto)?', type: 'yesno' },
      { id: 'income_pension_cancel', label: 'Příjmy z zrušení penzijního/životního pojištění?', type: 'yesno' },
    ],
  },
  {
    id: 'deductions',
    title: 'Slevy na dani',
    icon: 'percent',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o studiu dětí, čestné prohlášení manžela/manželky',
    questions: [
      { id: 'deduction_children', label: 'Sleva na děti?', type: 'yesno' },
      { id: 'deduction_children_list', label: 'Jména a rodná čísla dětí', type: 'children', conditionalOn: 'deduction_children' },
      { id: 'deduction_spouse', label: 'Sleva na manžela/manželku?', type: 'yesno' },
      { id: 'deduction_spouse_name', label: 'Jméno manžela/manželky', type: 'text', conditionalOn: 'deduction_spouse', placeholder: 'Celé jméno' },
      { id: 'deduction_spouse_bn', label: 'Rodné číslo manžela/manželky', type: 'text', conditionalOn: 'deduction_spouse', placeholder: '000000/0000' },
      { id: 'deduction_disability', label: 'Sleva na invaliditu?', type: 'yesno' },
      { id: 'deduction_ztp', label: 'Sleva na držitele průkazu ZTP?', type: 'yesno' },
    ],
  },
  {
    id: 'deductible',
    title: 'Odčitatelné položky',
    icon: 'receipt',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o darech, úrocích, pojištění',
    questions: [
      { id: 'ded_donation', label: 'Poskytnutý dar?', type: 'yesno' },
      { id: 'ded_mortgage', label: 'Hypotéční úroky?', type: 'yesno' },
      { id: 'ded_pension', label: 'Penzijní připojištění?', type: 'yesno' },
      { id: 'ded_life_insurance', label: 'Životní pojištění?', type: 'yesno' },
      { id: 'ded_union', label: 'Odborové příspěvky?', type: 'yesno' },
      { id: 'ded_exam', label: 'Úhrady zkoušky?', type: 'yesno' },
      { id: 'ded_research', label: 'Úhrady za výzkum a vývoj?', type: 'yesno' },
      { id: 'ded_education', label: 'Odpočet na podporu odborného vzdělávání?', type: 'yesno' },
    ],
  },
  {
    id: 'advances',
    title: 'Zálohy',
    icon: 'clock',
    questions: [
      { id: 'advance_income_tax', label: 'Zálohy na daň z příjmu?', type: 'yesno' },
      { id: 'advance_flat_tax', label: 'Paušální daň?', type: 'yesno' },
    ],
  },
  {
    id: 'social_insurance',
    title: 'Přehledy — Sociální pojištění',
    icon: 'shield',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o zaplacených zálohách z ePortálu ČSSZ',
    questions: [
      { id: 'si_variable_symbol', label: '8místný variabilní symbol OSSZ', type: 'text', placeholder: '12345678' },
      { id: 'si_pension_advances', label: 'Zálohy na důchodové pojištění?', type: 'yesno' },
      { id: 'si_secondary_activity', label: 'Činnost vedlejší (zaměstnání, důchod, rodičovská, mateřská, péče, student)?', type: 'yesno' },
      { id: 'si_sickness_insurance', label: 'Nemocenské pojištění?', type: 'yesno' },
    ],
  },
  {
    id: 'health_insurance',
    title: 'Přehledy — Zdravotní pojištění',
    icon: 'heart-pulse',
    allowDocUpload: true,
    uploadHint: 'Přehled záloh z portálu zdravotní pojišťovny',
    questions: [
      { id: 'hi_company', label: 'Zdravotní pojišťovna', type: 'select', options: HEALTH_INSURANCE_OPTIONS },
      { id: 'hi_advances', label: 'Zálohy na zdravotní pojištění?', type: 'yesno' },
      { id: 'hi_secondary_activity', label: 'Činnost vedlejší (státní pojištěnec, zaměstnání s min. ZP, nemocenská, ZTP, důchod, celodenní péče)?', type: 'yesno' },
    ],
  },
  {
    id: 'additional',
    title: 'Doplňující informace',
    icon: 'info',
    questions: [
      { id: 'add_business_change', label: 'Podnikání zahájeno/přerušeno/ukončeno?', type: 'yesno' },
      { id: 'add_flat_mode', label: 'Paušální režim?', type: 'yesno' },
      { id: 'add_activity_change', label: 'Změna hlavní/vedlejší činnost?', type: 'yesno' },
    ],
  },
]

export function countAnswered(responses: QuestionnaireResponses): { answered: number; total: number } {
  let answered = 0
  let total = 0
  for (const section of TAX_QUESTIONNAIRE_SECTIONS) {
    for (const q of section.questions) {
      if (q.conditionalOn) {
        if (responses[q.conditionalOn] !== true && responses[q.conditionalOn] !== 'yes') continue
      }
      total++
      const val = responses[q.id]
      if (val !== undefined && val !== null && val !== '') answered++
    }
  }
  return { answered, total }
}
