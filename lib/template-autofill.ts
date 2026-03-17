import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * CRM field mapping — maps template placeholder names to company data paths
 * Template authors use these as {placeholder} in DOCX:
 *
 * Company fields:
 *   {firma_nazev}, {firma_ico}, {firma_dic}, {firma_adresa}, {firma_mesto},
 *   {firma_psc}, {firma_email}, {firma_telefon}, {firma_bankovni_ucet},
 *   {firma_jednatel}, {firma_pravni_forma}
 *
 * Signer fields (auto from first signer):
 *   {podepisujici_jmeno}, {podepisujici_email}, {podepisujici_telefon}
 *
 * Date fields:
 *   {datum_dnes}, {datum_podpisu}, {rok}, {mesic}
 *
 * Accountant fields:
 *   {ucetni_jmeno}, {ucetni_email}, {ucetni_firma}
 */

export interface AutoFillContext {
  companyId?: string
  signers?: Array<{ name: string; email: string; phone?: string }>
  userId?: string  // accountant user ID
  firmId?: string  // accounting firm ID
  insuranceCaseId?: string  // PU case for insurance contract fields
}

interface ResolvedContext {
  company?: any
  signers?: Array<{ name: string; email: string; phone?: string }>
  accountant?: any
  firm?: any
  insuranceCase?: any
  insuranceCompany?: any
}

const CRM_FIELD_MAP: Record<string, (ctx: ResolvedContext) => string> = {
  // Company
  'firma_nazev': (ctx) => ctx.company?.name || '',
  'firma_ico': (ctx) => ctx.company?.ico || '',
  'firma_dic': (ctx) => ctx.company?.dic || '',
  'firma_adresa': (ctx) => {
    const a = ctx.company?.address
    if (!a) return ''
    return [a.street, a.city, a.zip].filter(Boolean).join(', ')
  },
  'firma_mesto': (ctx) => ctx.company?.address?.city || '',
  'firma_psc': (ctx) => ctx.company?.address?.zip || '',
  'firma_email': (ctx) => ctx.company?.email || '',
  'firma_telefon': (ctx) => ctx.company?.phone || '',
  'firma_bankovni_ucet': (ctx) => ctx.company?.bank_account || '',
  'firma_jednatel': (ctx) => ctx.company?.managing_director || '',
  'firma_pravni_forma': (ctx) => ctx.company?.legal_form || '',

  // First signer
  'podepisujici_jmeno': (ctx) => ctx.signers?.[0]?.name || '',
  'podepisujici_email': (ctx) => ctx.signers?.[0]?.email || '',
  'podepisujici_telefon': (ctx) => ctx.signers?.[0]?.phone || '',

  // Dates
  'datum_dnes': () => new Date().toLocaleDateString('cs-CZ'),
  'datum_podpisu': () => new Date().toLocaleDateString('cs-CZ'),
  'rok': () => new Date().getFullYear().toString(),
  'mesic': () => (new Date().getMonth() + 1).toString().padStart(2, '0'),

  // Accountant
  'ucetni_jmeno': (ctx) => ctx.accountant?.name || '',
  'ucetni_email': (ctx) => ctx.accountant?.email || '',
  'ucetni_firma': (ctx) => ctx.firm?.name || '',

  // Insurance case (PU)
  'pu_cislo': (ctx) => ctx.insuranceCase?.case_number || '',
  'pojistovna_nazev': (ctx) => ctx.insuranceCompany?.name || '',
  'pu_popis': (ctx) => ctx.insuranceCase?.event_description || '',
  'pu_datum': (ctx) => {
    const d = ctx.insuranceCase?.event_date
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('cs-CZ') } catch { return d }
  },
  'success_fee_procent': (ctx) => ctx.insuranceCase?.success_fee_percent?.toString() || '',
  'fixni_odmena': (ctx) => {
    const mode = ctx.insuranceCase?.service_mode
    if (mode === 'ai_processing') return '199'
    if (mode === 'consultation') return '1 499'
    if (mode === 'full_representation') return '1 499'
    return ''
  },
}

/**
 * Resolve auto-fill data for template fields from CRM/company data
 */
export async function resolveAutoFillData(
  context: AutoFillContext
): Promise<Record<string, string>> {
  const resolved: ResolvedContext = {
    signers: context.signers,
  }

  // Load company data
  if (context.companyId) {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('name, ico, dic, email, phone, bank_account, managing_director, legal_form, address, firm_id')
      .eq('id', context.companyId)
      .single()
    resolved.company = data
  }

  // Load accountant data
  if (context.userId) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('name, email, firm_id')
      .eq('id', context.userId)
      .single()
    resolved.accountant = data

    // Load firm if available
    const firmId = context.firmId || data?.firm_id
    if (firmId) {
      const { data: firm } = await supabaseAdmin
        .from('accounting_firms')
        .select('name, email, ico')
        .eq('id', firmId)
        .single()
      resolved.firm = firm
    }
  }

  // Load insurance case data
  if (context.insuranceCaseId) {
    const { data: ic } = await supabaseAdmin
      .from('insurance_cases')
      .select('case_number, event_description, event_date, service_mode, success_fee_percent, insurance_company_id')
      .eq('id', context.insuranceCaseId)
      .single()
    resolved.insuranceCase = ic

    if (ic?.insurance_company_id) {
      const { data: ico } = await supabaseAdmin
        .from('insurance_companies')
        .select('name')
        .eq('id', ic.insurance_company_id)
        .single()
      resolved.insuranceCompany = ico
    }
  }

  // Build auto-fill map — only include non-empty values
  const result: Record<string, string> = {}
  for (const [field, resolver] of Object.entries(CRM_FIELD_MAP)) {
    const value = resolver(resolved)
    if (value) {
      result[field] = value
    }
  }

  return result
}

/**
 * Classify template fields as auto-fillable or manual.
 * Call this after parsing template placeholders to tag which can be auto-filled.
 */
export function classifyTemplateFields(
  fieldNames: string[]
): Array<{ name: string; type: string; source: 'crm' | 'manual'; crm_field?: string; required: boolean }> {
  return fieldNames.map(name => {
    const lowerName = name.toLowerCase()
    if (CRM_FIELD_MAP[lowerName]) {
      return { name, type: 'text', source: 'crm' as const, crm_field: lowerName, required: false }
    }
    return { name, type: 'text', source: 'manual' as const, required: true }
  })
}

/**
 * Get list of all available auto-fill fields with descriptions
 */
export function getAvailableAutoFillFields(): Array<{ field: string; description: string; category: string }> {
  return [
    { field: 'firma_nazev', description: 'Název firmy klienta', category: 'Firma' },
    { field: 'firma_ico', description: 'IČO', category: 'Firma' },
    { field: 'firma_dic', description: 'DIČ', category: 'Firma' },
    { field: 'firma_adresa', description: 'Celá adresa', category: 'Firma' },
    { field: 'firma_mesto', description: 'Město', category: 'Firma' },
    { field: 'firma_psc', description: 'PSČ', category: 'Firma' },
    { field: 'firma_email', description: 'Email firmy', category: 'Firma' },
    { field: 'firma_telefon', description: 'Telefon firmy', category: 'Firma' },
    { field: 'firma_bankovni_ucet', description: 'Bankovní účet', category: 'Firma' },
    { field: 'firma_jednatel', description: 'Jednatel', category: 'Firma' },
    { field: 'firma_pravni_forma', description: 'Právní forma', category: 'Firma' },
    { field: 'podepisujici_jmeno', description: 'Jméno podepisujícího', category: 'Podepisující' },
    { field: 'podepisujici_email', description: 'Email podepisujícího', category: 'Podepisující' },
    { field: 'podepisujici_telefon', description: 'Telefon podepisujícího', category: 'Podepisující' },
    { field: 'datum_dnes', description: 'Dnešní datum', category: 'Datum' },
    { field: 'datum_podpisu', description: 'Datum podpisu', category: 'Datum' },
    { field: 'rok', description: 'Aktuální rok', category: 'Datum' },
    { field: 'mesic', description: 'Aktuální měsíc', category: 'Datum' },
    { field: 'ucetni_jmeno', description: 'Jméno účetního', category: 'Účetní' },
    { field: 'ucetni_email', description: 'Email účetního', category: 'Účetní' },
    { field: 'ucetni_firma', description: 'Název účetní firmy', category: 'Účetní' },
    { field: 'pu_cislo', description: 'Číslo pojistné události', category: 'Pojistná událost' },
    { field: 'pojistovna_nazev', description: 'Název pojišťovny', category: 'Pojistná událost' },
    { field: 'pu_popis', description: 'Popis pojistné události', category: 'Pojistná událost' },
    { field: 'pu_datum', description: 'Datum pojistné události', category: 'Pojistná událost' },
    { field: 'success_fee_procent', description: 'Success fee (%)', category: 'Pojistná událost' },
    { field: 'fixni_odmena', description: 'Fixní odměna (Kč)', category: 'Pojistná událost' },
  ]
}
