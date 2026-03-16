export type SigningStatus = 'draft' | 'pending' | 'partially_signed' | 'signed' | 'rejected' | 'expired' | 'error' | 'cancelled'

export type SignatureType = 'simple' | 'drawn' | 'bank_id_sign' | 'qualified'

export type SigningDocumentType = 'contract' | 'amendment' | 'power_of_attorney' | 'mandate' | 'price_addendum' | 'other'

export interface SigningJob {
  id: string
  company_id: string | null
  template_id: string | null
  created_by: string
  document_name: string
  document_type: SigningDocumentType
  signi_contract_id: string | null
  signature_type: SignatureType
  status: SigningStatus
  note: string | null
  signed_at: string | null
  signed_document_path: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface SigningSigner {
  id: string
  signing_job_id: string
  name: string
  email: string
  phone: string | null
  role: 'sign' | 'approve'
  status: 'waiting' | 'signed' | 'rejected' | 'expired'
  signi_signer_id: string | null
  signed_at: string | null
  rejected_reason: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface SigningEvent {
  id: string
  signing_job_id: string
  event_type: string
  actor: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SigningTemplate {
  id: string
  name: string
  created_by: string
  file_path: string
  fields: TemplateField[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateField {
  name: string
  type: 'text' | 'number' | 'date'
  source: 'crm' | 'manual'
  required: boolean
  crm_field?: string
}

// Signi API types
export interface SigniSignerInput {
  name: string
  email: string
  phone?: string
  contract_role: 'sign' | 'approve' | 'sign_bank_id_sign'
  order?: number
}

export interface SigniContractResponse {
  contract_id: string
  status: string
  sign_identities: SigniSignIdentity[]
  file_url?: string
}

export interface SigniSignIdentity {
  id: string
  name: string
  email: string
  status: string
  signed_at?: string
}

export interface SigniWebhookPayload {
  state: 'signed' | 'rejected' | 'expired'
  contract_id: string
  message?: string
  file?: string
}
