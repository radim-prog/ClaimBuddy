// Multi-tenant types for accounting firms

export type FirmStatus = 'active' | 'pending' | 'suspended' | 'cancelled'

export type FirmPlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface FirmAddress {
  street?: string
  city?: string
  zip?: string
  region?: string
}

export interface FirmDriveCredentials {
  client_id?: string
  client_secret?: string
  refresh_token?: string
  root_folder_id?: string
  connected_at?: string
  connected_by?: string
}

export interface FirmSettings {
  default_signature_type?: string
  auto_fill_templates?: boolean
  drive_sync_enabled?: boolean
  max_users?: number
  branding?: {
    primary_color?: string
    logo_url?: string
  }
}

export interface AccountingFirm {
  id: string
  name: string
  ico: string | null
  dic: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: FirmAddress
  logo_url: string | null

  plan_tier: FirmPlanTier
  stripe_customer_id: string | null
  billing_email: string | null

  signi_api_key: string | null
  google_drive_credentials: FirmDriveCredentials | null
  settings: FirmSettings

  marketplace_provider_id: string | null
  status: FirmStatus
  onboarded_at: string | null

  created_at: string
  updated_at: string
}

export interface CreateFirmInput {
  name: string
  ico?: string
  dic?: string
  email?: string
  phone?: string
  website?: string
  address?: FirmAddress
  plan_tier?: FirmPlanTier
}

export interface UpdateFirmInput {
  name?: string
  ico?: string | null
  dic?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: FirmAddress
  logo_url?: string | null
  plan_tier?: FirmPlanTier
  billing_email?: string | null
  settings?: Partial<FirmSettings>
  status?: FirmStatus
}

export interface FirmWithStats extends AccountingFirm {
  user_count: number
  company_count: number
  active_signing_jobs: number
  drive_connected: boolean
}

// Helper functions
export function firmStatusLabel(status: FirmStatus): string {
  const labels: Record<FirmStatus, string> = {
    active: 'Aktivní',
    pending: 'Čeká na schválení',
    suspended: 'Pozastaveno',
    cancelled: 'Zrušeno',
  }
  return labels[status] || status
}

export function firmStatusColor(status: FirmStatus): string {
  const colors: Record<FirmStatus, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function firmPlanLabel(tier: FirmPlanTier): string {
  const labels: Record<FirmPlanTier, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }
  return labels[tier] || tier
}

export function firmPlanColor(tier: FirmPlanTier): string {
  const colors: Record<FirmPlanTier, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }
  return colors[tier] || 'bg-gray-100 text-gray-700'
}
