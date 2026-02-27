// Mock data a typy pro UcetniWebApp
// Data jsou v Supabase, zde zůstávají typy, konstanty a helper funkce

// Import Task type for use in functions below, re-export for backward compatibility
import type { Task, TaskStatus, TaskType, BillingType, GTDEnergyLevel, GTDContext } from '@/lib/types/tasks'
export type { Task, TaskStatus, TaskType, BillingType, GTDContext }
export type EnergyLevel = GTDEnergyLevel

// mockUsers + MOCK_CONFIG DELETED - all pages now fetch from /api/accountant/users

// ============================================
// TYPES
// ============================================

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

// Task interface is re-exported from @/lib/types/tasks (see top of file)

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
  company_id: string | null
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
  number_series_id?: string
  constant_symbol?: string
  specific_symbol?: string
  notes?: string
  footer_text?: string
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


