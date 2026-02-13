import { supabaseAdmin } from '@/lib/supabase-admin'

export interface Company {
  id: string
  name: string
  ico: string
  dic: string | null
  legal_form: string
  vat_payer: boolean
  vat_period: string | null
  address: { street: string; city: string; zip: string }
  email: string | null
  phone: string | null
  pohoda_id: string | null
  bank_account: string | null
  status: string
  reliability_score: number
  pohoda_years: number[]
  invoice_stats: { total: number; issued: number; received: number }
  total_revenue: number
  has_employees: boolean
  group_name: string | null
  owner_id: string | null
  assigned_accountant_id: string | null
  created_at: string
  updated_at: string
}

export async function getAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new Error(`Failed to fetch companies: ${error.message}`)
  return (data ?? []) as Company[]
}

export async function getActiveCompanies(): Promise<Company[]> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new Error(`Failed to fetch active companies: ${error.message}`)
  return (data ?? []) as Company[]
}

export async function getDemoCompanyIds(): Promise<string[]> {
  const all = await getAllCompanies()
  return all.filter(c => c.status === 'active').slice(0, 3).map(c => c.id)
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch company: ${error.message}`)
  }
  return data as Company
}

export async function getCompanyByIco(ico: string): Promise<Company | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('ico', ico)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch company: ${error.message}`)
  }
  return data as Company
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to update company: ${error.message}`)
  }
  return data as Company
}

export interface CreateCompanyInput {
  name: string
  ico: string
  dic?: string | null
  legal_form: string
  vat_payer: boolean
  vat_period?: string | null
  address: { street: string; city: string; zip: string }
  email?: string | null
  phone?: string | null
  bank_account?: string | null
  status?: string
  assigned_accountant_id?: string | null
  has_employees?: boolean
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name: input.name,
      ico: input.ico,
      dic: input.dic || null,
      legal_form: input.legal_form,
      vat_payer: input.vat_payer,
      vat_period: input.vat_period || null,
      address: input.address,
      email: input.email || null,
      phone: input.phone || null,
      bank_account: input.bank_account || null,
      status: input.status || 'active',
      assigned_accountant_id: input.assigned_accountant_id || null,
      has_employees: input.has_employees || false,
      pohoda_years: [],
      invoice_stats: {},
      total_revenue: 0,
      reliability_score: 5,
      pohoda_id: null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Firma s IČO ${input.ico} již existuje`)
    }
    throw new Error(`Failed to create company: ${error.message}`)
  }
  return data as Company
}
