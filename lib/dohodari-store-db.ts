import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  Dohoda,
  DohodaMesic,
  DohodaDocument,
  DohodaStatus,
  VykazStatus,
  PaymentStatus,
  CalculationParams,
} from '@/lib/types/dohodari'
import { calculateDohodaMesic } from '@/lib/types/dohodari'

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapDohoda(row: any): Dohoda {
  return {
    id: row.id,
    company_id: row.company_id,
    employee_id: row.employee_id,
    typ: row.typ,
    popis_prace: row.popis_prace || '',
    misto_vykonu: row.misto_vykonu || '',
    sazba: Number(row.sazba) || 0,
    max_hodin_rok: row.max_hodin_rok ?? 300,
    platnost_od: row.platnost_od,
    platnost_do: row.platnost_do || null,
    prohlaseni_podepsano: row.prohlaseni_podepsano ?? false,
    prohlaseni_datum: row.prohlaseni_datum || null,
    podpis_zamestnavatel: row.podpis_zamestnavatel ?? false,
    podpis_zamestnanec: row.podpis_zamestnanec ?? false,
    podpis_datum: row.podpis_datum || null,
    status: row.status || 'draft',
    notes: row.notes || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    employee: row.employees ? {
      first_name: row.employees.first_name,
      last_name: row.employees.last_name,
      birth_date: row.employees.birth_date,
      personal_id: row.employees.personal_id,
      email: row.employees.email,
      phone: row.employees.phone,
      address: row.employees.address,
      health_insurance: row.employees.health_insurance,
      bank_account: row.employees.bank_account,
    } : undefined,
  }
}

function mapVykaz(row: any): DohodaMesic {
  return {
    id: row.id,
    dohoda_id: row.dohoda_id,
    company_id: row.company_id,
    period: row.period,
    hodiny: Number(row.hodiny) || 0,
    hruba_mzda: Number(row.hruba_mzda) || 0,
    socialni_zamestnanec: Number(row.socialni_zamestnanec) || 0,
    socialni_zamestnavatel: Number(row.socialni_zamestnavatel) || 0,
    zdravotni_zamestnanec: Number(row.zdravotni_zamestnanec) || 0,
    zdravotni_zamestnavatel: Number(row.zdravotni_zamestnavatel) || 0,
    typ_dane: row.typ_dane || 'srazkova',
    dan: Number(row.dan) || 0,
    sleva_poplatnik: Number(row.sleva_poplatnik) || 0,
    cista_mzda: Number(row.cista_mzda) || 0,
    naklady_zamestnavatel: Number(row.naklady_zamestnavatel) || 0,
    payment_status: row.payment_status || 'unpaid',
    payment_date: row.payment_date || null,
    payment_method: row.payment_method || 'bank',
    vykaz_status: row.vykaz_status || 'draft',
    notes: row.notes || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    dohoda: row.dohody ? mapDohoda(row.dohody) : undefined,
  }
}

function mapDocument(row: any): DohodaDocument {
  return {
    id: row.id,
    dohoda_id: row.dohoda_id,
    company_id: row.company_id,
    doc_type: row.doc_type,
    generated_url: row.generated_url || null,
    signed_url: row.signed_url || null,
    period: row.period || null,
    status: row.status || 'generated',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// ============================================
// DOHODY CRUD
// ============================================

export async function getDohody(
  companyId: string,
  filters?: { status?: DohodaStatus; typ?: 'dpp' | 'dpc'; employee_id?: string }
): Promise<Dohoda[]> {
  let query = supabaseAdmin
    .from('dohody')
    .select('*, employees(first_name, last_name, birth_date, personal_id, email, phone, address, health_insurance, bank_account)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.typ) query = query.eq('typ', filters.typ)
  if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch dohody: ${error.message}`)
  return (data ?? []).map(mapDohoda)
}

export async function getDohodaById(id: string, companyId: string): Promise<Dohoda | null> {
  const { data, error } = await supabaseAdmin
    .from('dohody')
    .select('*, employees(first_name, last_name, birth_date, personal_id, email, phone, address, health_insurance, bank_account)')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to fetch dohoda: ${error.message}`)
  }
  return mapDohoda(data)
}

export async function createDohoda(input: {
  company_id: string
  employee_id: string
  typ: 'dpp' | 'dpc'
  popis_prace?: string
  misto_vykonu?: string
  sazba: number
  max_hodin_rok?: number
  platnost_od: string
  platnost_do?: string | null
  prohlaseni_podepsano?: boolean
  prohlaseni_datum?: string | null
  status?: DohodaStatus
  notes?: string | null
}): Promise<Dohoda> {
  const { data, error } = await supabaseAdmin
    .from('dohody')
    .insert({
      company_id: input.company_id,
      employee_id: input.employee_id,
      typ: input.typ,
      popis_prace: input.popis_prace || '',
      misto_vykonu: input.misto_vykonu || '',
      sazba: input.sazba,
      max_hodin_rok: input.max_hodin_rok ?? (input.typ === 'dpp' ? 300 : 1040),
      platnost_od: input.platnost_od,
      platnost_do: input.platnost_do || null,
      prohlaseni_podepsano: input.prohlaseni_podepsano ?? false,
      prohlaseni_datum: input.prohlaseni_datum || null,
      status: input.status || 'draft',
      notes: input.notes || null,
    })
    .select('*, employees(first_name, last_name, birth_date, personal_id, email, phone, address, health_insurance, bank_account)')
    .single()

  if (error) throw new Error(`Failed to create dohoda: ${error.message}`)
  return mapDohoda(data)
}

export async function updateDohoda(
  id: string,
  companyId: string,
  updates: Partial<Omit<Dohoda, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee'>>
): Promise<Dohoda> {
  const { employee: _, ...safeUpdates } = updates as any
  const { data, error } = await supabaseAdmin
    .from('dohody')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, employees(first_name, last_name, birth_date, personal_id, email, phone, address, health_insurance, bank_account)')
    .single()

  if (error) throw new Error(`Failed to update dohoda: ${error.message}`)
  return mapDohoda(data)
}

export async function deleteDohoda(id: string, companyId: string): Promise<void> {
  // Soft delete: set status to terminated
  const { error } = await supabaseAdmin
    .from('dohody')
    .update({ status: 'terminated', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw new Error(`Failed to delete dohoda: ${error.message}`)
}

// ============================================
// VYKAZY (Monthly timesheets) CRUD
// ============================================

export async function getVykazy(
  dohodaId: string,
  filters?: { vykaz_status?: VykazStatus; payment_status?: PaymentStatus }
): Promise<DohodaMesic[]> {
  let query = supabaseAdmin
    .from('dohoda_mesice')
    .select('*')
    .eq('dohoda_id', dohodaId)
    .order('period', { ascending: false })

  if (filters?.vykaz_status) query = query.eq('vykaz_status', filters.vykaz_status)
  if (filters?.payment_status) query = query.eq('payment_status', filters.payment_status)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch vykazy: ${error.message}`)
  return (data ?? []).map(mapVykaz)
}

export async function getVykazyByCompany(
  companyId: string,
  period?: string,
  filters?: { payment_status?: PaymentStatus; vykaz_status?: VykazStatus }
): Promise<DohodaMesic[]> {
  let query = supabaseAdmin
    .from('dohoda_mesice')
    .select('*, dohody(*, employees(first_name, last_name, birth_date, personal_id, email, phone, address, health_insurance, bank_account))')
    .eq('company_id', companyId)
    .order('period', { ascending: false })

  if (period) query = query.eq('period', period)
  if (filters?.payment_status) query = query.eq('payment_status', filters.payment_status)
  if (filters?.vykaz_status) query = query.eq('vykaz_status', filters.vykaz_status)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch vykazy by company: ${error.message}`)
  return (data ?? []).map(mapVykaz)
}

export async function createVykaz(input: {
  dohoda_id: string
  company_id: string
  period: string
  hodiny: number
  // Optional overrides for calculation params
  prohlaseni?: boolean
  student?: boolean
  disability_level?: 0 | 1 | 2 | 3
  children_count?: number
  notes?: string | null
}): Promise<DohodaMesic> {
  // Get the dohoda to know rate and type
  const { data: dohoda, error: dohodaErr } = await supabaseAdmin
    .from('dohody')
    .select('typ, sazba, prohlaseni_podepsano')
    .eq('id', input.dohoda_id)
    .single()

  if (dohodaErr || !dohoda) throw new Error('Dohoda not found')

  // Auto-calculate payroll
  const calcParams: CalculationParams = {
    typ: dohoda.typ,
    hodiny: input.hodiny,
    sazba: Number(dohoda.sazba),
    prohlaseni: input.prohlaseni ?? dohoda.prohlaseni_podepsano,
    student: input.student,
    disability_level: input.disability_level,
    children_count: input.children_count,
  }
  const calc = calculateDohodaMesic(calcParams)

  const { data, error } = await supabaseAdmin
    .from('dohoda_mesice')
    .insert({
      dohoda_id: input.dohoda_id,
      company_id: input.company_id,
      period: input.period,
      hodiny: input.hodiny,
      hruba_mzda: calc.gross,
      socialni_zamestnanec: calc.social_employee,
      socialni_zamestnavatel: calc.social_employer,
      zdravotni_zamestnanec: calc.health_employee,
      zdravotni_zamestnavatel: calc.health_employer,
      typ_dane: calc.tax_type,
      dan: calc.tax_amount,
      sleva_poplatnik: calc.tax_credit,
      cista_mzda: calc.net,
      naklady_zamestnavatel: calc.total_employer_cost,
      notes: input.notes || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create vykaz: ${error.message}`)
  return mapVykaz(data)
}

export async function updateVykaz(
  id: string,
  companyId: string,
  updates: Partial<Pick<DohodaMesic, 'hodiny' | 'notes' | 'vykaz_status' | 'payment_status' | 'payment_date' | 'payment_method'>>
): Promise<DohodaMesic> {
  const { data, error } = await supabaseAdmin
    .from('dohoda_mesice')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update vykaz: ${error.message}`)
  return mapVykaz(data)
}

export async function confirmVykaz(id: string, companyId: string): Promise<DohodaMesic> {
  return updateVykaz(id, companyId, { vykaz_status: 'confirmed' })
}

export async function markVykazPaid(
  id: string,
  companyId: string,
  paymentData: { payment_date: string; payment_method?: 'bank' | 'cash' | 'other' }
): Promise<DohodaMesic> {
  return updateVykaz(id, companyId, {
    payment_status: 'paid',
    payment_date: paymentData.payment_date,
    payment_method: paymentData.payment_method || 'bank',
  })
}

// ============================================
// DOCUMENTS
// ============================================

export async function getDohodaDocuments(dohodaId: string): Promise<DohodaDocument[]> {
  const { data, error } = await supabaseAdmin
    .from('dohoda_documents')
    .select('*')
    .eq('dohoda_id', dohodaId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`)
  return (data ?? []).map(mapDocument)
}

export async function createDohodaDocument(input: {
  dohoda_id: string
  company_id: string
  doc_type: DohodaDocument['doc_type']
  generated_url?: string
  period?: string
}): Promise<DohodaDocument> {
  const { data, error } = await supabaseAdmin
    .from('dohoda_documents')
    .insert({
      dohoda_id: input.dohoda_id,
      company_id: input.company_id,
      doc_type: input.doc_type,
      generated_url: input.generated_url || null,
      period: input.period || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create document: ${error.message}`)
  return mapDocument(data)
}

export async function markDocumentSigned(
  id: string,
  signedData: { signed_url: string }
): Promise<DohodaDocument> {
  const { data, error } = await supabaseAdmin
    .from('dohoda_documents')
    .update({
      signed_url: signedData.signed_url,
      status: 'signed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to mark document signed: ${error.message}`)
  return mapDocument(data)
}

// ============================================
// STATISTICS
// ============================================

export async function getDohodariStats(companyId: string, year?: number): Promise<{
  total_dohody: number
  active_dpp: number
  active_dpc: number
  total_vykazy: number
  unpaid_vykazy: number
  total_gross: number
  total_employer_cost: number
  total_employer_saving: number
}> {
  const currentYear = year || new Date().getFullYear()
  const periodPrefix = `${currentYear}-`

  // Count active agreements
  const { data: dohody } = await supabaseAdmin
    .from('dohody')
    .select('typ, status')
    .eq('company_id', companyId)
    .in('status', ['active', 'draft'])

  const activeDohody = dohody ?? []

  // Get vykazy for the year
  const { data: vykazy } = await supabaseAdmin
    .from('dohoda_mesice')
    .select('hruba_mzda, naklady_zamestnavatel, payment_status')
    .eq('company_id', companyId)
    .like('period', `${periodPrefix}%`)

  const allVykazy = vykazy ?? []

  const totalGross = allVykazy.reduce((sum, v) => sum + Number(v.hruba_mzda || 0), 0)
  const totalEmployerCost = allVykazy.reduce((sum, v) => sum + Number(v.naklady_zamestnavatel || 0), 0)
  // Saving = gross - employer_cost difference vs HPP (employer cost for HPP = gross * 1.338)
  const hppEquivCost = totalGross * 1.338
  const totalSaving = Math.round(hppEquivCost - totalEmployerCost)

  return {
    total_dohody: activeDohody.length,
    active_dpp: activeDohody.filter(d => d.typ === 'dpp').length,
    active_dpc: activeDohody.filter(d => d.typ === 'dpc').length,
    total_vykazy: allVykazy.length,
    unpaid_vykazy: allVykazy.filter(v => v.payment_status === 'unpaid').length,
    total_gross: totalGross,
    total_employer_cost: totalEmployerCost,
    total_employer_saving: Math.max(0, totalSaving),
  }
}

// ============================================
// PAYMENT MATCHING
// ============================================

export async function matchPaymentToVykaz(vykazId: string, bankTxId: string): Promise<void> {
  const { error: txError } = await supabaseAdmin
    .from('bank_transactions')
    .update({ matched_dohoda_mesic_id: vykazId })
    .eq('id', bankTxId)

  if (txError) throw new Error(`Failed to match payment: ${txError.message}`)

  const { error: vykazError } = await supabaseAdmin
    .from('dohoda_mesice')
    .update({
      payment_status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank',
      updated_at: new Date().toISOString(),
    })
    .eq('id', vykazId)

  if (vykazError) throw new Error(`Failed to update vykaz payment: ${vykazError.message}`)
}

export async function getUnmatchedVykazy(companyId: string): Promise<DohodaMesic[]> {
  const { data, error } = await supabaseAdmin
    .from('dohoda_mesice')
    .select('*, dohody(*, employees(first_name, last_name))')
    .eq('company_id', companyId)
    .eq('payment_status', 'unpaid')
    .eq('vykaz_status', 'confirmed')
    .order('period', { ascending: false })

  if (error) throw new Error(`Failed to fetch unmatched vykazy: ${error.message}`)
  return (data ?? []).map(mapVykaz)
}
