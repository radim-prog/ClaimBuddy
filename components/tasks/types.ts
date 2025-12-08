/**
 * Task Management Types
 *
 * TypeScript types for the GTD task management system.
 * These types align with the database schema defined in the design document.
 */

// Task Status
export type TaskStatus =
  | 'draft'
  | 'pending'
  | 'clarifying'
  | 'accepted'
  | 'in_progress'
  | 'waiting_for'
  | 'waiting_client'
  | 'completed'
  | 'cancelled'
  | 'someday_maybe'
  | 'invoiced'

// Task Priority
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

// GTD Energy Level
export type GTDEnergyLevel = 'high' | 'medium' | 'low'

// GTD Contexts
export type GTDContext =
  | '@telefon'
  | '@email'
  | '@počítač'
  | '@klient'
  | '@kancelář'

// Time Tracking Entry
export interface TimeTrackingEntry {
  id: string
  task_id: string
  user_id: string
  user_name: string
  started_at: string
  stopped_at?: string
  duration_minutes?: number
  note?: string
  billable: boolean
  created_at: string
}

// Task Checklist Item (Subtask)
export interface TaskChecklistItem {
  id: string
  task_id: string
  text: string
  position: number
  completed: boolean

  // Deadline & assignment
  due_date?: string
  due_time?: string
  assigned_to?: string
  assigned_to_name?: string

  // Time tracking
  estimated_minutes?: number
  actual_minutes?: number
  time_entries?: TimeTrackingEntry[]

  gtd_context?: GTDContext
  completed_by?: string
  completed_at?: string
  created_at: string
}

// Task
export interface Task {
  id: string

  // Basic info
  title: string
  description?: string

  // GTD: Task vs. Project
  is_project: boolean
  project_outcome?: string
  parent_project_id?: string

  // Workflow
  status: TaskStatus
  priority: TaskPriority

  // Assignment & Delegation
  created_by: string
  created_by_name: string
  assigned_to?: string
  assigned_to_name?: string
  delegated_from?: string
  delegated_to?: string
  delegation_reason?: string

  is_waiting_for: boolean
  waiting_for_who?: string
  waiting_for_what?: string
  last_reminded_at?: string

  accepted: boolean
  accepted_at?: string

  // Deadline
  due_date?: string
  due_time?: string

  // Relations
  company_id: string
  company_name: string
  monthly_closure_id?: string
  document_id?: string
  onboarding_client_id?: string

  // Time Tracking
  estimated_minutes?: number
  actual_minutes?: number
  time_tracking_started_at?: string
  time_tracking_entries?: TimeTrackingEntry[]

  // Billing
  is_billable: boolean
  hourly_rate?: number
  billable_hours?: number
  invoiced_amount?: number
  last_invoiced_at?: string
  invoice_period?: string // 'YYYY-MM'

  // GTD Specific
  gtd_context?: GTDContext[]
  gtd_energy_level?: GTDEnergyLevel
  gtd_is_quick_action?: boolean

  // Metadata
  tags?: string[]
  progress_percentage?: number
  task_data?: any

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// Task Timeline Event
export interface TaskTimelineEvent {
  id: string
  company_id: string
  task_id?: string
  project_id?: string

  event_type:
    | 'task_created'
    | 'task_assigned'
    | 'task_accepted'
    | 'task_started'
    | 'task_completed'
    | 'task_delegated'
    | 'project_created'
    | 'project_milestone'
    | 'time_logged'
    | 'invoice_generated'

  event_data: any
  created_by: string
  created_by_name: string
  created_at: string

  // Display in timeline
  display_title: string
  display_icon: string
  display_color: string
}

// Task Invoice
export interface TaskInvoice {
  id: string
  task_id: string
  company_id: string

  invoice_period: string // 'YYYY-MM'
  total_hours: number
  hourly_rate: number
  total_amount: number

  status: 'draft' | 'sent' | 'paid'
  generated_at: string
  sent_at?: string
  paid_at?: string

  invoice_data?: any
}

// GTD Wizard Data (component-specific)
export interface GTDWizardData {
  // Step 1: Clarify
  title: string
  description: string
  isProject: boolean
  projectOutcome: string

  // Step 2: Quick Action (2-minute rule)
  isQuickAction: boolean

  // Step 3: Delegate
  shouldDelegate: boolean
  delegateTo?: string
  delegationReason?: string

  // Step 4: Context & Energy
  contexts: GTDContext[]
  energyLevel: GTDEnergyLevel | ''

  // Step 4b: Time Estimate
  estimatedMinutes?: number

  // Step 5: Billable
  isBillable: boolean
  hourlyRate?: number

  // Additional fields
  dueDate?: string
  dueTime?: string
  assignedTo?: string

  // For projects: subtasks
  subtasks: GTDWizardSubtask[]
}

// Subtask in GTD Wizard
export interface GTDWizardSubtask {
  id: string
  text: string
  dueDate?: string
  dueTime?: string
  assignedTo?: string
  estimatedMinutes?: number
}

// Helper: Convert GTDWizardData to Task creation payload
export function gtdWizardDataToTask(
  wizardData: GTDWizardData,
  companyId: string,
  companyName: string,
  createdBy: string,
  createdByName: string
): Omit<Task, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: wizardData.title,
    description: wizardData.description,

    is_project: wizardData.isProject,
    project_outcome: wizardData.isProject ? wizardData.projectOutcome : undefined,

    status: wizardData.isQuickAction ? 'completed' : 'pending',
    priority: 'medium',

    created_by: createdBy,
    created_by_name: createdByName,
    assigned_to: wizardData.shouldDelegate ? wizardData.delegateTo : wizardData.assignedTo,
    delegated_to: wizardData.shouldDelegate ? wizardData.delegateTo : undefined,
    delegation_reason: wizardData.delegationReason,

    is_waiting_for: wizardData.shouldDelegate,
    accepted: false,

    due_date: wizardData.dueDate,
    due_time: wizardData.dueTime,

    company_id: companyId,
    company_name: companyName,

    estimated_minutes: wizardData.estimatedMinutes,
    actual_minutes: 0,

    is_billable: wizardData.isBillable,
    hourly_rate: wizardData.hourlyRate,
    billable_hours: 0,
    invoiced_amount: 0,

    gtd_context: wizardData.contexts,
    gtd_energy_level: wizardData.energyLevel || undefined,
    gtd_is_quick_action: wizardData.isQuickAction,

    progress_percentage: 0,
  }
}
