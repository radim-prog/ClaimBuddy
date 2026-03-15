// Onboarding questionnaire definition — questions for new clients

export type OnboardingQuestionType = 'yesno' | 'text' | 'select' | 'multi_text'

export interface OnboardingQuestion {
  id: string
  label: string
  type: OnboardingQuestionType
  placeholder?: string
  conditionalOn?: string
  options?: { value: string; label: string }[]
  hint?: string
}

export interface OnboardingSection {
  id: string
  title: string
  icon: string
  questions: OnboardingQuestion[]
}

export interface OnboardingResponses {
  [key: string]: string | boolean | string[] | null | undefined
}

export const LEGAL_FORM_OPTIONS = [
  { value: 'osvc', label: 'OSVČ (fyzická osoba podnikající)' },
  { value: 'sro', label: 's.r.o. (společnost s ručením omezeným)' },
  { value: 'as', label: 'a.s. (akciová společnost)' },
  { value: 'vs', label: 'v.o.s. (veřejná obchodní společnost)' },
  { value: 'ks', label: 'k.s. (komanditní společnost)' },
  { value: 'druzstvo', label: 'Družstvo' },
  { value: 'other', label: 'Jiná' },
]

export const ACCOUNTING_TYPE_OPTIONS = [
  { value: 'evidence', label: 'Daňová evidence (jednoduché účetnictví)' },
  { value: 'accounting', label: 'Podvojné účetnictví' },
  { value: 'unknown', label: 'Nevím / nechám na účetní' },
]

export const DOCUMENT_DELIVERY_OPTIONS = [
  { value: 'portal', label: 'Přes klientský portál (doporučeno)' },
  { value: 'email', label: 'E-mailem' },
  { value: 'physical', label: 'Fyzicky / osobně' },
  { value: 'mixed', label: 'Kombinace' },
]

export const ONBOARDING_QUESTIONNAIRE_SECTIONS: OnboardingSection[] = [
  {
    id: 'company_info',
    title: 'Základní údaje o firmě',
    icon: 'building',
    questions: [
      { id: 'legal_form', label: 'Právní forma', type: 'select', options: LEGAL_FORM_OPTIONS },
      { id: 'ico', label: 'IČO', type: 'text', placeholder: '12345678' },
      { id: 'dic', label: 'DIČ', type: 'text', placeholder: 'CZ12345678' },
      { id: 'company_name', label: 'Obchodní název', type: 'text', placeholder: 'Název firmy s.r.o.' },
      { id: 'address', label: 'Sídlo firmy', type: 'text', placeholder: 'Ulice, PSČ Město' },
      { id: 'managing_director', label: 'Jednatel / odpovědná osoba', type: 'text', placeholder: 'Jméno a příjmení' },
      { id: 'data_box_id', label: 'ID datové schránky', type: 'text', placeholder: 'abc1234', hint: 'Pokud máte zřízenou datovou schránku' },
    ],
  },
  {
    id: 'contact',
    title: 'Kontaktní údaje',
    icon: 'phone',
    questions: [
      { id: 'contact_name', label: 'Kontaktní osoba', type: 'text', placeholder: 'Jméno a příjmení' },
      { id: 'contact_email', label: 'E-mail', type: 'text', placeholder: 'email@example.com' },
      { id: 'contact_phone', label: 'Telefon', type: 'text', placeholder: '+420 xxx xxx xxx' },
      { id: 'billing_email', label: 'E-mail pro zasílání faktur', type: 'text', placeholder: 'Ponechte prázdné pokud stejný jako kontaktní', hint: 'Kam chcete zasílat vaše vystavené faktury' },
    ],
  },
  {
    id: 'accounting',
    title: 'Účetnictví a daně',
    icon: 'calculator',
    questions: [
      { id: 'accounting_type', label: 'Typ účetnictví', type: 'select', options: ACCOUNTING_TYPE_OPTIONS },
      { id: 'vat_payer', label: 'Jste plátce DPH?', type: 'yesno' },
      { id: 'vat_period', label: 'Období DPH', type: 'select', conditionalOn: 'vat_payer', options: [
        { value: 'monthly', label: 'Měsíční' },
        { value: 'quarterly', label: 'Čtvrtletní' },
      ]},
      { id: 'has_employees', label: 'Máte zaměstnance?', type: 'yesno' },
      { id: 'employee_count', label: 'Počet zaměstnanců', type: 'text', conditionalOn: 'has_employees', placeholder: 'Počet' },
      { id: 'has_agreements', label: 'Máte pracovníky na DPP/DPČ?', type: 'yesno' },
      { id: 'previous_accountant', label: 'Předchozí účetní / firma', type: 'text', placeholder: 'Název předchozí účetní firmy', hint: 'Pro zajištění plynulého předání' },
      { id: 'accounting_start', label: 'Od kdy chcete vést účetnictví u nás?', type: 'text', placeholder: 'např. od 1.1.2026 nebo ihned' },
    ],
  },
  {
    id: 'bank',
    title: 'Bankovní údaje',
    icon: 'banknote',
    questions: [
      { id: 'bank_account', label: 'Číslo bankovního účtu', type: 'text', placeholder: '123456789/0100' },
      { id: 'bank_name', label: 'Název banky', type: 'text', placeholder: 'např. Komerční banka' },
      { id: 'has_multiple_accounts', label: 'Máte více bankovních účtů?', type: 'yesno' },
      { id: 'additional_accounts', label: 'Další účty', type: 'text', conditionalOn: 'has_multiple_accounts', placeholder: 'Čísla dalších účtů (oddělte čárkou)' },
      { id: 'bank_auto_statements', label: 'Zasíláte bankovní výpisy automaticky?', type: 'yesno', hint: 'Nastavení automatického zasílání měsíčních výpisů' },
    ],
  },
  {
    id: 'documents',
    title: 'Dokumenty a doručování',
    icon: 'file-text',
    questions: [
      { id: 'document_delivery', label: 'Jak chcete doručovat doklady?', type: 'select', options: DOCUMENT_DELIVERY_OPTIONS },
      { id: 'has_cash_register', label: 'Máte pokladnu / hotovostní operace?', type: 'yesno' },
      { id: 'has_foreign_transactions', label: 'Máte zahraniční obchody?', type: 'yesno' },
      { id: 'has_company_car', label: 'Používáte firemní vozidlo?', type: 'yesno' },
      { id: 'has_property', label: 'Vlastníte nemovitost zařazenou v podnikání?', type: 'yesno' },
    ],
  },
  {
    id: 'expectations',
    title: 'Očekávání a poznámky',
    icon: 'info',
    questions: [
      { id: 'main_expectations', label: 'Co od spolupráce s účetní nejvíce očekáváte?', type: 'text', placeholder: 'Vaše očekávání...' },
      { id: 'pain_points', label: 'S čím jste měli u předchozí účetní problémy?', type: 'text', placeholder: 'Případné problémy z minulosti...' },
      { id: 'additional_notes', label: 'Další poznámky', type: 'text', placeholder: 'Cokoli dalšího, co bychom měli vědět...' },
    ],
  },
]

// Count answered questions
export function countOnboardingAnswered(responses: OnboardingResponses): { answered: number; total: number } {
  let answered = 0
  let total = 0

  for (const section of ONBOARDING_QUESTIONNAIRE_SECTIONS) {
    for (const q of section.questions) {
      if (q.conditionalOn && responses[q.conditionalOn] !== true) continue
      total++
      const val = responses[q.id]
      if (val !== undefined && val !== null && val !== '') {
        answered++
      }
    }
  }

  return { answered, total }
}
