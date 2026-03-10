// Raynet CRM types

export interface RaynetCompany {
  id: number
  name: string
  regNumber: string | null
  person: boolean
  state: string
  category: { id: number; value: string } | null
}

export interface RaynetBC {
  id: number
  name: string
  company: { id: number; name: string }
  totalAmount: number
  validFrom: string
  validTill: string | null
  status: string // E_WIN | B_ACTIVE | G_STORNO
  businessCasePhase: { id: number; value: string }
  businessCaseType: { id: number; value: string }
}

export interface RaynetMapping {
  company_id: string
  company_name: string
  raynet_company_id: number | null
  raynet_company_name: string | null
  last_sync_at: string | null
  sync_status: 'synced' | 'never_synced' | 'error' | null
}

export interface RaynetPaymentLink {
  id: string
  company_id: string
  period: string
  raynet_bc_id: number
  raynet_bc_name: string | null
  raynet_amount: number | null
  is_extra_service: boolean
  created_at: string
  updated_at: string
}

export interface SyncResult {
  synced: number
  updated: number
  created: number
  errors: string[]
}

export interface CreateBCPayload {
  name: string
  companyId: number
  totalAmount?: number
  validFrom: string
}
