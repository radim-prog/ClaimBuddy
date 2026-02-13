// ============================================
// PROJECT MANAGEMENT - TypeScript Types
// ============================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'
export type PhaseStatus = 'pending' | 'active' | 'completed'

export interface Project {
  id: string
  title: string
  description?: string
  outcome?: string
  status: ProjectStatus
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  actual_hours: number
  progress_percentage: number
  tags: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  // Case management fields (spisový systém)
  is_case?: boolean
  case_number?: string
  case_type_id?: string
  case_type_name?: string
  case_opened_at?: string
  case_closed_at?: string
  case_opposing_party?: string
  case_reference?: string
  hourly_rate?: number
}

export interface ProjectPhase {
  id: string
  project_id: string
  title: string
  description?: string
  position: number
  status: PhaseStatus
  due_date?: string
  created_at: string
}

export interface ProjectWithPhases extends Project {
  phases?: ProjectPhase[]
  task_count?: number
  completed_task_count?: number
}

export interface CreateProjectInput {
  title: string
  description?: string
  outcome?: string
  status?: ProjectStatus
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
  is_case?: boolean
  case_type_id?: string
  case_opposing_party?: string
  case_reference?: string
  hourly_rate?: number
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  outcome?: string
  status?: ProjectStatus
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
  completed_at?: string
  is_case?: boolean
  case_type_id?: string
  case_opposing_party?: string
  case_reference?: string
  hourly_rate?: number
}

export interface CreatePhaseInput {
  title: string
  description?: string
  position?: number
  due_date?: string
}

export interface UpdatePhaseInput {
  title?: string
  description?: string
  position?: number
  status?: PhaseStatus
  due_date?: string
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'planning', 'active', 'on_hold', 'review', 'completed', 'cancelled'
]

export const PHASE_STATUSES: PhaseStatus[] = ['pending', 'active', 'completed']

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'gray',
  active: 'blue',
  on_hold: 'orange',
  review: 'purple',
  completed: 'green',
  cancelled: 'red',
}

// ============================================
// CASE MANAGEMENT TYPES (Spisový systém)
// ============================================

export interface CaseType {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  default_hourly_rate?: number
  template_phases?: { title: string; order: number }[]
  created_at: string
}

export type CaseEventType =
  | 'note'
  | 'document'
  | 'email'
  | 'phone_call'
  | 'meeting'
  | 'deadline'
  | 'status_change'
  | 'task_completed'
  | 'invoice_sent'
  | 'state_filing'
  | 'client_request'
  | 'internal'

export interface CaseTimelineEntry {
  id: string
  project_id: string
  event_type: CaseEventType
  title: string
  description?: string
  created_by?: string
  created_by_name?: string
  event_date: string
  task_id?: string
  document_url?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type CaseDocumentCategory =
  | 'contract'
  | 'invoice'
  | 'correspondence'
  | 'state_document'
  | 'tax_return'
  | 'financial_report'
  | 'evidence'
  | 'other'

export interface CaseDocument {
  id: string
  project_id: string
  name: string
  file_url?: string
  file_type?: string
  file_size_bytes?: number
  category: CaseDocumentCategory
  version: number
  description?: string
  uploaded_by?: string
  uploaded_by_name?: string
  created_at: string
}

export interface CaseBudgetData {
  total_hours: number
  total_billable_hours: number
  hourly_rate: number
  estimated_revenue: number
  total_invoiced: number
  remaining: number
}

export const CASE_EVENT_TYPES: { value: CaseEventType; label: string; icon: string }[] = [
  { value: 'note', label: 'Pozn\u00e1mka', icon: 'StickyNote' },
  { value: 'document', label: 'Dokument', icon: 'FileText' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'phone_call', label: 'Telefon\u00e1t', icon: 'Phone' },
  { value: 'meeting', label: 'Sch\u016fzka', icon: 'Users' },
  { value: 'deadline', label: 'Term\u00edn', icon: 'Clock' },
  { value: 'status_change', label: 'Zm\u011bna stavu', icon: 'RefreshCw' },
  { value: 'task_completed', label: 'Dokon\u010den\u00ed \u00fakolu', icon: 'CheckCircle' },
  { value: 'invoice_sent', label: 'Odesl\u00e1n\u00ed faktury', icon: 'Send' },
  { value: 'state_filing', label: 'Pod\u00e1n\u00ed na \u00fa\u0159ad', icon: 'Building' },
  { value: 'client_request', label: 'Po\u017eadavek klienta', icon: 'User' },
  { value: 'internal', label: 'Intern\u00ed', icon: 'Settings' },
]

export const CASE_DOCUMENT_CATEGORIES: { value: CaseDocumentCategory; label: string; color: string }[] = [
  { value: 'contract', label: 'Smlouva', color: 'bg-purple-100 text-purple-800' },
  { value: 'invoice', label: 'Faktura', color: 'bg-green-100 text-green-800' },
  { value: 'correspondence', label: 'Korespondence', color: 'bg-blue-100 text-blue-800' },
  { value: 'state_document', label: '\u00da\u0159edn\u00ed dokument', color: 'bg-red-100 text-red-800' },
  { value: 'tax_return', label: 'Da\u0148ov\u00e9 p\u0159izn\u00e1n\u00ed', color: 'bg-orange-100 text-orange-800' },
  { value: 'financial_report', label: 'V\u00fdkaz', color: 'bg-teal-100 text-teal-800' },
  { value: 'evidence', label: 'D\u016fkaz', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Ostatn\u00ed', color: 'bg-gray-100 text-gray-800' },
]
