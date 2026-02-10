// Mock data a typy pro UcetniWebApp
// Data jsou v Supabase, zde zůstávají typy, konstanty a helper funkce

import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'

// ============================================
// CENTRÁLNÍ KONFIGURACE
// ============================================

function getCurrentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MOCK_CONFIG = {
  CURRENT_PERIOD: getCurrentPeriod(),
  PREVIOUS_PERIOD: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })(),

  COMPANIES_DROPDOWN_LIMIT: 10,
  COMPANIES_CLIENT_VIEW_LIMIT: 3,
  TASKS_PAGE_SIZE: 50,
  RECENT_COMPLETED_LIMIT: 5,

  CURRENT_USER_ID: 'user-2-accountant',
  CURRENT_USER_NAME: 'Radim Zajíček',

  QUICK_ACTION_THRESHOLD: 30,
  GTD_DO_IT_NOW_THRESHOLD: 2,

  SCORE_HIGH_THRESHOLD: 9,
  SCORE_MEDIUM_THRESHOLD: 6,

  DATA_START_YEAR: new Date().getFullYear(),
  CURRENT_YEAR: new Date().getFullYear(),
}

// ============================================
// MOCK USERS
// ============================================

export const mockUsers = [
  {
    id: 'user-1-client',
    email: 'karel@example.com',
    name: 'Karel Novák',
    role: 'client' as const,
    phone_number: '+420777123456',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2-accountant',
    email: 'jana@ucetni.cz',
    name: 'Radim Zajíček',
    role: 'accountant' as const,
    phone_number: '+420777654321',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3-accountant',
    email: 'petr@ucetni.cz',
    name: 'Petr Novotný',
    role: 'accountant' as const,
    phone_number: '+420777888999',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-4-assistant',
    email: 'marie@ucetni.cz',
    name: 'Marie Dvořáková',
    role: 'assistant' as const,
    phone_number: '+420777111222',
    created_at: '2025-01-01T00:00:00Z',
  },
]

// Data v Supabase, použijte company-store.ts
export const mockCompanies: any[] = []

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
// MOCK DATA ARRAYS (prázdné - data v Supabase)
// ============================================

export const mockTasks: Task[] = []
export const mockTimeLogs: TimeLog[] = []
export const mockInvoices: Invoice[] = []
export const mockProjects: Project[] = []

// Interní arrays pro helper funkce
const mockAssets: Asset[] = []
const mockInsurances: Insurance[] = []

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

// ============================================
// COMPANY HELPERS
// ============================================

export function getCompanyReliabilityScore(companyId: string): 0 | 1 | 2 | 3 {
  const company = mockCompanies.find(c => c.id === companyId) as typeof mockCompanies[0] & { reliability_score?: 0 | 1 | 2 | 3 }
  return company?.reliability_score ?? 2
}

export function getReliabilityLabel(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return 'Beznadějný'
    case 1: return 'Problémový'
    case 2: return 'Normální'
    case 3: return 'Spolehlivý'
  }
}

export function getReliabilityEmoji(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return '🔴'
    case 1: return '🟠'
    case 2: return '🟡'
    case 3: return '🟢'
  }
}

// ============================================
// TASK HELPERS
// ============================================

export function getTasksByCompany(companyId: string) {
  return mockTasks.filter(t => t.company_id === companyId)
}

export function getAllProjects(): Project[] {
  return mockProjects
}

// ============================================
// ASSET & INSURANCE HELPERS
// ============================================

export function getAssetsByCompany(companyId: string): Asset[] {
  return mockAssets.filter(a => a.company_id === companyId)
}

export function getInsurancesByCompany(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId)
}

// ============================================
// TIME LOG HELPERS
// ============================================

export function getTimeLogsForTask(taskId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.task_id === taskId)
}

function getTimeLogsForClient(clientId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.client_id === clientId ||
    (tl.task_id && mockTasks.find(t => t.id === tl.task_id)?.company_id === clientId)
  )
}

export function getUserTimeStats(userId: string, month?: string): {
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  taskMinutes: number
  nonTaskMinutes: number
  byActivityType: Record<ActivityType, number>
} {
  const logs = month
    ? mockTimeLogs.filter(tl => tl.user_id === userId && tl.date && tl.date.startsWith(month))
    : mockTimeLogs.filter(tl => tl.user_id === userId)

  const byActivityType: Record<ActivityType, number> = {
    task: 0, general: 0, admin: 0, meeting: 0, call: 0, email: 0,
  }

  let totalMinutes = 0
  let billableMinutes = 0
  let nonBillableMinutes = 0
  let taskMinutes = 0
  let nonTaskMinutes = 0

  logs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) billableMinutes += log.minutes
    else nonBillableMinutes += log.minutes
    if (log.task_id) taskMinutes += log.minutes
    else nonTaskMinutes += log.minutes
    byActivityType[log.activity_type] += log.minutes
  })

  return { totalMinutes, billableMinutes, nonBillableMinutes, taskMinutes, nonTaskMinutes, byActivityType }
}

export function getClientTimeStats(clientId: string, month?: string): {
  totalMinutes: number
  billableMinutes: number
  byUser: { userId: string; userName: string; minutes: number }[]
  byActivityType: Record<ActivityType, number>
} {
  const clientLogs = getTimeLogsForClient(clientId).filter(tl =>
    !month || (tl.date && tl.date.startsWith(month))
  )

  const byActivityType: Record<ActivityType, number> = {
    task: 0, general: 0, admin: 0, meeting: 0, call: 0, email: 0,
  }

  const userMap = new Map<string, { userName: string; minutes: number }>()
  let totalMinutes = 0
  let billableMinutes = 0

  clientLogs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) billableMinutes += log.minutes
    byActivityType[log.activity_type] += log.minutes

    const existing = userMap.get(log.user_id)
    if (existing) existing.minutes += log.minutes
    else userMap.set(log.user_id, { userName: log.user_name, minutes: log.minutes })
  })

  return {
    totalMinutes,
    billableMinutes,
    byUser: Array.from(userMap.entries()).map(([userId, data]) => ({
      userId, userName: data.userName, minutes: data.minutes,
    })),
    byActivityType,
  }
}

export function addTimeLog(log: Omit<TimeLog, 'id' | 'created_at'>): TimeLog {
  const newLog: TimeLog = {
    ...log,
    id: `tl-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  mockTimeLogs.push(newLog)
  return newLog
}

// ============================================
// INVOICE HELPERS
// ============================================

type MockCompany = typeof mockCompanies[number]

let invoiceCounter = 1

function generateInvoiceNumber(type: InvoiceType): string {
  const year = new Date().getFullYear()
  const prefix = type === 'accountant_to_client' ? 'FV' : 'FA'
  const number = String(invoiceCounter++).padStart(4, '0')
  return `${prefix}-${year}-${number}`
}

function getAllBillableTasks(): Task[] {
  return mockTasks.filter(task =>
    task.status === 'completed' &&
    task.is_billable === true &&
    task.billing_type === 'extra' &&
    !task.invoiced
  )
}

export function getBillableTasksByCompany(): Record<string, { company: MockCompany, tasks: Task[], totalHours: number, totalAmount: number }> {
  const billableTasks = getAllBillableTasks()
  const grouped: Record<string, { company: MockCompany, tasks: Task[], totalHours: number, totalAmount: number }> = {}

  billableTasks.forEach(task => {
    if (!grouped[task.company_id]) {
      const company = mockCompanies.find(c => c.id === task.company_id)
      if (company) {
        grouped[task.company_id] = { company, tasks: [], totalHours: 0, totalAmount: 0 }
      }
    }
    if (grouped[task.company_id]) {
      grouped[task.company_id].tasks.push(task)
      const hours = (task.actual_minutes || task.estimated_minutes || 0) / 60
      grouped[task.company_id].totalHours += hours
      grouped[task.company_id].totalAmount += hours * (task.hourly_rate || 0)
    }
  })

  return grouped
}

export function createInvoiceFromTasks(
  taskIds: string[],
  type: InvoiceType = 'accountant_to_client'
): Invoice | null {
  const tasks = mockTasks.filter(t => taskIds.includes(t.id))
  if (tasks.length === 0) return null

  const firstTask = tasks[0]
  const company = mockCompanies.find(c => c.id === firstTask.company_id)
  if (!company) return null

  const items: InvoiceItem[] = tasks.map((task, index) => {
    const hours = (task.actual_minutes || task.estimated_minutes || 0) / 60
    const unitPrice = task.hourly_rate || 800
    const totalWithoutVat = hours * unitPrice
    const vatRate = 21
    const totalWithVat = totalWithoutVat * (1 + vatRate / 100)

    return {
      id: `item-${index + 1}`,
      description: task.title,
      quantity: Math.round(hours * 100) / 100,
      unit: 'hod',
      unit_price: unitPrice,
      vat_rate: vatRate,
      total_without_vat: Math.round(totalWithoutVat * 100) / 100,
      total_with_vat: Math.round(totalWithVat * 100) / 100,
      task_id: task.id
    }
  })

  const totalWithoutVat = items.reduce((sum, item) => sum + item.total_without_vat, 0)
  const totalVat = items.reduce((sum, item) => sum + (item.total_with_vat - item.total_without_vat), 0)
  const totalWithVat = totalWithoutVat + totalVat

  const now = new Date()
  const dueDate = new Date(now)
  const billingSettings = (company as unknown as { billing_settings?: { invoice_maturity?: number } }).billing_settings
  dueDate.setDate(dueDate.getDate() + (billingSettings?.invoice_maturity || 14))

  const invoiceNumber = generateInvoiceNumber(type)
  const variableSymbol = invoiceNumber.replace(/[^0-9]/g, '')

  return {
    id: `inv-${Date.now()}`,
    type,
    company_id: company.id,
    company_name: company.name,
    invoice_number: invoiceNumber,
    variable_symbol: variableSymbol,
    issue_date: now.toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    tax_date: now.toISOString().split('T')[0],
    items,
    total_without_vat: Math.round(totalWithoutVat * 100) / 100,
    total_vat: Math.round(totalVat * 100) / 100,
    total_with_vat: Math.round(totalWithVat * 100) / 100,
    status: 'draft',
    task_ids: taskIds,
    created_at: now.toISOString(),
    created_by: MOCK_CONFIG.CURRENT_USER_ID,
    updated_at: now.toISOString()
  }
}

export function markTasksAsInvoiced(taskIds: string[], invoiceId: string): void {
  const now = new Date().toISOString()
  taskIds.forEach(taskId => {
    const task = mockTasks.find(t => t.id === taskId)
    if (task) {
      task.invoiced = true
      task.invoiced_at = now
      task.invoice_id = invoiceId
    }
  })
}
