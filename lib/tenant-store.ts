import { supabaseAdmin } from '@/lib/supabase-admin'
import type { AccountingFirm, CreateFirmInput, UpdateFirmInput, FirmWithStats, FirmBillingSettings, FirmDunningSettings } from '@/lib/types/tenant'

export const DEFAULT_BILLING_SETTINGS: Required<FirmBillingSettings> = {
  billing_day: 1,
  payment_due_days: 14,
  penalty_rate: 0.0005,
  currency: 'CZK',
}

export const DEFAULT_DUNNING_SETTINGS: Required<FirmDunningSettings> = {
  enabled: true,
  levels: [
    { days_overdue: 7, channels: ['email', 'in_app'] },
    { days_overdue: 14, channels: ['email', 'in_app'] },
    { days_overdue: 30, channels: ['email', 'in_app'] },
  ],
}

export async function getAllFirms(): Promise<FirmWithStats[]> {
  const { data: firms, error } = await supabaseAdmin
    .from('accounting_firms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !firms) return []

  // Enrich with stats
  const enriched = await Promise.all(firms.map(async (firm) => {
    const [usersResult, companiesResult, jobsResult] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
      supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
      supabaseAdmin.from('signing_jobs').select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'pending', 'partially_signed'])
        .eq('company_id', firm.id), // approximate — should be via firm companies
    ])

    return {
      ...firm,
      user_count: usersResult.count || 0,
      company_count: companiesResult.count || 0,
      active_signing_jobs: jobsResult.count || 0,
      drive_connected: !!firm.google_drive_credentials?.refresh_token,
    } as FirmWithStats
  }))

  return enriched
}

export async function getFirmById(firmId: string): Promise<AccountingFirm | null> {
  const { data, error } = await supabaseAdmin
    .from('accounting_firms')
    .select('*')
    .eq('id', firmId)
    .single()

  if (error || !data) return null
  return data as AccountingFirm
}

export async function getFirmByUserId(userId: string): Promise<AccountingFirm | null> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('firm_id')
    .eq('id', userId)
    .single()

  if (!user?.firm_id) return null
  return getFirmById(user.firm_id)
}

export async function createFirm(input: CreateFirmInput): Promise<AccountingFirm | null> {
  const { data, error } = await supabaseAdmin
    .from('accounting_firms')
    .insert({
      name: input.name,
      ico: input.ico || null,
      dic: input.dic || null,
      email: input.email || null,
      phone: input.phone || null,
      website: input.website || null,
      address: input.address || {},
      plan_tier: input.plan_tier || 'free',
      status: 'active',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[TenantStore] Create firm error:', error)
    return null
  }
  return data as AccountingFirm
}

export async function updateFirm(firmId: string, input: UpdateFirmInput): Promise<AccountingFirm | null> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.name !== undefined) updateData.name = input.name
  if (input.ico !== undefined) updateData.ico = input.ico
  if (input.dic !== undefined) updateData.dic = input.dic
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.website !== undefined) updateData.website = input.website
  if (input.address !== undefined) updateData.address = input.address
  if (input.logo_url !== undefined) updateData.logo_url = input.logo_url
  if (input.plan_tier !== undefined) updateData.plan_tier = input.plan_tier
  if (input.billing_email !== undefined) updateData.billing_email = input.billing_email
  if (input.settings !== undefined) updateData.settings = input.settings
  if (input.status !== undefined) updateData.status = input.status

  const { data, error } = await supabaseAdmin
    .from('accounting_firms')
    .update(updateData)
    .eq('id', firmId)
    .select()
    .single()

  if (error || !data) {
    console.error('[TenantStore] Update firm error:', error)
    return null
  }
  return data as AccountingFirm
}

export async function assignUserToFirm(userId: string, firmId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ firm_id: firmId })
    .eq('id', userId)

  if (error) {
    console.error('[TenantStore] Assign user error:', error)
    return false
  }
  return true
}

export async function assignCompanyToFirm(companyId: string, firmId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('companies')
    .update({ firm_id: firmId })
    .eq('id', companyId)

  if (error) {
    console.error('[TenantStore] Assign company error:', error)
    return false
  }
  return true
}

export async function getFirmUsers(firmId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true })

  return data || []
}

export async function getFirmCompanies(firmId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id, name, ico, status, assigned_accountant_id')
    .eq('firm_id', firmId)
    .order('name', { ascending: true })

  return data || []
}

export async function getFirmBillingSettings(firmId: string): Promise<FirmBillingSettings> {
  const firm = await getFirmById(firmId)
  if (!firm) return { ...DEFAULT_BILLING_SETTINGS }

  return {
    ...DEFAULT_BILLING_SETTINGS,
    ...firm.settings?.billing,
  }
}

// Create firm from marketplace registration
export async function createFirmFromMarketplace(
  providerId: string,
  userId: string
): Promise<AccountingFirm | null> {
  // Load marketplace provider data
  const { data: provider } = await supabaseAdmin
    .from('marketplace_providers')
    .select('*')
    .eq('id', providerId)
    .single()

  if (!provider) return null

  // Create firm from provider data
  const firm = await createFirm({
    name: provider.name,
    ico: provider.ico,
    dic: provider.dic,
    email: provider.email,
    phone: provider.phone,
    website: provider.website,
    address: {
      street: provider.street,
      city: provider.city,
      zip: provider.zip,
      region: provider.region,
    },
  })

  if (!firm) return null

  // Link marketplace provider to firm
  await supabaseAdmin
    .from('accounting_firms')
    .update({ marketplace_provider_id: providerId })
    .eq('id', firm.id)

  // Assign the registering user to the firm
  await assignUserToFirm(userId, firm.id)

  return firm
}
