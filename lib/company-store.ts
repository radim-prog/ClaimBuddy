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
