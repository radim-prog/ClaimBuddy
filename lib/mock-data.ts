// Mock data a typy pro UcetniWebApp
// Data jsou v Supabase, zde zůstávají typy, konstanty a helper funkce


// mockUsers + MOCK_CONFIG DELETED - all pages now fetch from /api/accountant/users

// ============================================
// TYPES
// ============================================

export type TaskStatus =
  | 'pending'
  | 'clarifying'
  | 'accepted'
  | 'in_progress'
  | 'waiting_for'
  | 'waiting_client'
  | 'awaiting_approval'
  | 'completed'
  | 'invoiced'
  | 'cancelled'
  | 'someday_maybe'

export type TaskType = 'base' | 'bonus'
export type BillingType = 'tariff' | 'extra' | 'free'
export type GTDContext = '@email' | '@telefon' | '@pocitac' | '@kancelar' | '@meeting' | '@anywhere'
export type EnergyLevel = 'high' | 'medium' | 'low'
export type ActivityType = 'task' | 'general' | 'admin' | 'meeting' | 'call' | 'email'

export interface TimeLog {
  id: string
  task_id?: string
  user_id: string
  user_name: string
  client_id?: string
  client_name?: string
  activity_type: ActivityType
  date: string
  minutes: number
  description: string
  is_billable: boolean
  created_at: string
}

// ============================================
// TASK
// ============================================

export interface Task {
  id: string
  title: string
  description: string

  // Hierarchie
  project_id?: string
  project_name?: string
  phase_id?: string
  phase_name?: string
  position_in_phase?: number

  // Závislosti
  depends_on_task_ids?: string[]
  is_blocked?: boolean

  // GTD
  is_next_action?: boolean

  // Legacy
  is_project: boolean
  project_outcome?: string
  parent_project_id?: string

  // Workflow
  status: TaskStatus
  priority?: string

  // Gamification
  task_type?: TaskType
  points_value?: number
  claimed_by?: string
  claimed_by_name?: string
  claimed_at?: string

  // Assignment
  created_by: string
  created_by_name: string
  assigned_to?: string
  assigned_to_name?: string

  // Waiting
  is_waiting_for: boolean
  waiting_for_who?: string
  waiting_for_what?: string

  // Deadline
  due_date: string
  due_time?: string

  // Client
  company_id: string
  company_name: string

  // GTD context
  location_id?: string
  gtd_context?: GTDContext[]
  gtd_energy_level?: EnergyLevel
  gtd_is_quick_action?: boolean

  // Time tracking
  estimated_minutes?: number
  estimate_locked?: boolean
  actual_minutes?: number

  // Billing
  is_billable: boolean
  hourly_rate?: number
  billing_type?: BillingType
  invoiced?: boolean
  invoiced_at?: string
  invoice_id?: string

  // Metadata
  tags?: string[]
  progress_percentage?: number

  // R-Tasks Scoring
  score_money?: 0 | 1 | 2 | 3
  score_fire?: 0 | 1 | 2 | 3
  score_time?: 0 | 1 | 2 | 3
  score_distance?: 0 | 1 | 2
  score_personal?: 0 | 1
  total_score?: number

  // Approval
  approved_by?: string
  approved_by_name?: string
  approved_at?: string
  rejected_by?: string
  rejected_by_name?: string
  rejected_at?: string
  rejection_comment?: string
  rejection_count?: number

  // Urgency & Escalation
  urgency_count?: number
  last_urged_at?: string
  escalated_to?: string
  escalated_at?: string
  escalation_reason?: string
  auto_notifications_sent?: number

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// ============================================
// INVOICE
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type InvoiceType = 'accountant_to_client' | 'client_to_customer'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  total_without_vat: number
  total_with_vat: number
  task_id?: string
}

export interface Invoice {
  id: string
  type: InvoiceType
  company_id: string
  company_name: string
  invoice_number: string
  variable_symbol: string
  issue_date: string
  due_date: string
  tax_date: string
  customer?: {
    name: string
    ico?: string
    dic?: string
    address: string
  }
  items: InvoiceItem[]
  total_without_vat: number
  total_vat: number
  total_with_vat: number
  status: InvoiceStatus
  paid_at?: string
  task_ids: string[]
  pohoda_id?: string
  created_at: string
  created_by: string
  updated_at: string
}

// ============================================
// PROJECT
// ============================================

export type ProjectType = 'recurring' | 'one_time' | 'ongoing'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'

export interface Project {
  id: string
  title: string
  description?: string
  outcome: string
  company_id: string
  company_name: string
  project_type: ProjectType
  recurrence?: {
    pattern: 'monthly' | 'quarterly' | 'yearly'
    period_label: string
    template_id?: string
  }
  start_date?: string
  target_date: string
  actual_end_date?: string
  status: ProjectStatus
  owner_id: string
  owner_name: string
  team_ids: string[]
  team_names: string[]
  next_action_id?: string
  is_someday_maybe: boolean
  priority?: 0 | 1 | 2 | 3
  is_billable: boolean
  budget_hours?: number
  hourly_rate?: number
  total_tasks?: number
  completed_tasks?: number
  progress_percent?: number
  created_at: string
  updated_at: string
}

// ============================================
// URGENCY & ESCALATION
// ============================================

export const URGENCY_CONFIG = {
  MAX_URGENCIES_BEFORE_ESCALATION: 3,
  DAYS_BETWEEN_URGENCIES: 2,
  AUTO_ESCALATE_AFTER_DAYS: 7,
}

export function getEscalationLevel(task: Task): 0 | 1 | 2 | 3 {
  if (task.escalated_to) return 3
  if (!task.urgency_count) return 0
  if (task.urgency_count >= URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION) return 2
  return 1
}

export function needsUrgency(task: Task): boolean {
  if (task.status !== 'waiting_for' && task.status !== 'waiting_client') return false
  if (task.escalated_to) return false
  if (!task.last_urged_at) return true

  try {
    const lastUrged = new Date(task.last_urged_at)
    if (isNaN(lastUrged.getTime())) return true
    const now = new Date()
    const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceLastUrge >= URGENCY_CONFIG.DAYS_BETWEEN_URGENCIES
  } catch {
    return true
  }
}

export function shouldEscalate(task: Task, maxUrgencies: number = URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION): boolean {
  if (task.escalated_to) return false
  if (task.urgency_count && task.urgency_count >= maxUrgencies) return true

  if (task.last_urged_at) {
    const lastUrged = new Date(task.last_urged_at)
    const now = new Date()
    const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastUrge >= URGENCY_CONFIG.AUTO_ESCALATE_AFTER_DAYS) return true
  }

  return false
}

export function urgeTask(task: Task): Task {
  return {
    ...task,
    urgency_count: (task.urgency_count || 0) + 1,
    last_urged_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function escalateTask(task: Task, managerId: string, reason: string): Task {
  return {
    ...task,
    escalated_to: managerId,
    escalated_at: new Date().toISOString(),
    escalation_reason: reason,
    updated_at: new Date().toISOString(),
  }
}


