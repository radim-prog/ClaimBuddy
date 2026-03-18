import { supabaseAdmin } from '@/lib/supabase-admin'

// ============ TYPES ============

export interface CompanyOwnership {
  id: string
  parent_company_id: string
  child_company_id: string
  share_percentage: number
  relationship_type: 'ownership' | 'management' | 'advisory'
  valid_from: string
  valid_to: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GraphLayout {
  id: string
  user_id: string
  layout_type: 'galaxy' | 'tree' | 'matrix'
  positions: Record<string, { x: number; y: number; fx?: number; fy?: number }>
  bubbles: Array<{ id: string; name: string; color: string; x: number; y: number; radius: number }>
  zoom_state: { k: number; x: number; y: number } | null
  updated_at: string
}

export interface CompanyNote {
  id: string
  company_id: string
  author_id: string
  author_name: string
  content: string
  tags: string[]
  mentions: string[]
  created_at: string
  updated_at: string
}

// Compact company data for graph nodes
export interface GraphCompany {
  id: string
  name: string
  ico: string
  dic: string | null
  company_type: string
  vat_payer: boolean
  status: string
  group_name: string | null
  managing_director: string | null
  address: { street: string; city: string; zip: string }
  has_employees: boolean
  total_revenue: number
  reliability_score: number
  founded_date: string | null
  holding_notes: string | null
}

// Full graph data (nodes + edges) returned by API
export interface CompanyGraphData {
  companies: GraphCompany[]
  ownership: CompanyOwnership[]
  layout: GraphLayout | null
}

// ============ OWNERSHIP CRUD ============

export async function getActiveOwnership(firmId?: string | null): Promise<CompanyOwnership[]> {
  let query = supabaseAdmin
    .from('company_ownership')
    .select('*')
    .is('valid_to', null)
    .order('created_at')

  // If firm-scoped, filter by companies belonging to the firm
  if (firmId) {
    const { data: companyIds } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('firm_id', firmId)
      .is('deleted_at', null)

    if (companyIds && companyIds.length > 0) {
      const ids = companyIds.map(c => c.id)
      query = query.or(`parent_company_id.in.(${ids.join(',')}),child_company_id.in.(${ids.join(',')})`)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch ownership: ${error.message}`)
  return (data ?? []) as CompanyOwnership[]
}

export async function createOwnership(input: {
  parent_company_id: string
  child_company_id: string
  share_percentage?: number
  relationship_type?: 'ownership' | 'management' | 'advisory'
  notes?: string
  created_by?: string
}): Promise<CompanyOwnership> {
  // Close any existing active ownership for this child
  await supabaseAdmin
    .from('company_ownership')
    .update({ valid_to: new Date().toISOString().split('T')[0] })
    .eq('child_company_id', input.child_company_id)
    .is('valid_to', null)

  const { data, error } = await supabaseAdmin
    .from('company_ownership')
    .insert({
      parent_company_id: input.parent_company_id,
      child_company_id: input.child_company_id,
      share_percentage: input.share_percentage ?? 100,
      relationship_type: input.relationship_type ?? 'ownership',
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create ownership: ${error.message}`)
  return data as CompanyOwnership
}

export async function updateOwnership(
  id: string,
  updates: { share_percentage?: number; relationship_type?: string; notes?: string }
): Promise<CompanyOwnership> {
  const { data, error } = await supabaseAdmin
    .from('company_ownership')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update ownership: ${error.message}`)
  return data as CompanyOwnership
}

export async function deleteOwnership(id: string): Promise<void> {
  // Soft-delete: set valid_to to today (preserves history)
  const { error } = await supabaseAdmin
    .from('company_ownership')
    .update({ valid_to: new Date().toISOString().split('T')[0] })
    .eq('id', id)

  if (error) throw new Error(`Failed to delete ownership: ${error.message}`)
}

// ============ GRAPH LAYOUT ============

export async function getGraphLayout(
  userId: string,
  layoutType: string = 'galaxy'
): Promise<GraphLayout | null> {
  const { data, error } = await supabaseAdmin
    .from('company_graph_layout')
    .select('*')
    .eq('user_id', userId)
    .eq('layout_type', layoutType)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch layout: ${error.message}`)
  }
  return data as GraphLayout
}

export async function saveGraphLayout(
  userId: string,
  layoutType: string,
  positions: Record<string, { x: number; y: number; fx?: number; fy?: number }>,
  bubbles?: Array<{ id: string; name: string; color: string; x: number; y: number; radius: number }>,
  zoomState?: { k: number; x: number; y: number }
): Promise<GraphLayout> {
  const { data, error } = await supabaseAdmin
    .from('company_graph_layout')
    .upsert({
      user_id: userId,
      layout_type: layoutType,
      positions,
      bubbles: bubbles ?? [],
      zoom_state: zoomState ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,layout_type' })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to save layout: ${error.message}`)
  return data as GraphLayout
}

// ============ COMPANY NOTES ============

export async function getCompanyNotes(companyId: string): Promise<CompanyNote[]> {
  const { data, error } = await supabaseAdmin
    .from('company_notes')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch notes: ${error.message}`)
  return (data ?? []) as CompanyNote[]
}

export async function createCompanyNote(input: {
  company_id: string
  author_id: string
  author_name: string
  content: string
  tags?: string[]
  mentions?: string[]
}): Promise<CompanyNote> {
  const { data, error } = await supabaseAdmin
    .from('company_notes')
    .insert({
      company_id: input.company_id,
      author_id: input.author_id,
      author_name: input.author_name,
      content: input.content,
      tags: input.tags ?? [],
      mentions: input.mentions ?? [],
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create note: ${error.message}`)
  return data as CompanyNote
}

export async function deleteCompanyNote(id: string, authorId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('company_notes')
    .delete()
    .eq('id', id)
    .eq('author_id', authorId) // Only author can delete

  if (error) throw new Error(`Failed to delete note: ${error.message}`)
}

// ============ GRAPH DATA (combined fetch) ============

export async function getCompanyGraphData(
  userId: string,
  firmId?: string | null
): Promise<CompanyGraphData> {
  // Fetch companies, ownership, and layout in parallel
  let companiesQuery = supabaseAdmin
    .from('companies')
    .select('id, name, ico, dic, company_type, vat_payer, status, group_name, managing_director, address, has_employees, total_revenue, reliability_score, founded_date, holding_notes')
    .is('deleted_at', null)
    .order('name')

  if (firmId) {
    companiesQuery = companiesQuery.eq('firm_id', firmId)
  }

  const [companiesRes, ownershipRes, layoutRes] = await Promise.all([
    companiesQuery,
    getActiveOwnership(firmId),
    getGraphLayout(userId),
  ])

  if (companiesRes.error) {
    throw new Error(`Failed to fetch companies: ${companiesRes.error.message}`)
  }

  return {
    companies: (companiesRes.data ?? []) as GraphCompany[],
    ownership: ownershipRes,
    layout: layoutRes,
  }
}

// ============ COMPANY TYPE UPDATE ============

export async function updateCompanyType(
  companyId: string,
  companyType: string
): Promise<void> {
  const validTypes = ['person', 'holding', 'subholding', 'daughter', 'granddaughter', 'standalone', 'external']
  if (!validTypes.includes(companyType)) {
    throw new Error(`Invalid company type: ${companyType}`)
  }

  const { error } = await supabaseAdmin
    .from('companies')
    .update({ company_type: companyType, updated_at: new Date().toISOString() })
    .eq('id', companyId)

  if (error) throw new Error(`Failed to update company type: ${error.message}`)
}
