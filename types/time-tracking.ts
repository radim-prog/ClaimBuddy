/**
 * Time Tracking Type Definitions
 *
 * TypeScript interfaces and types for the time tracking system
 */

/**
 * Time tracking entry record
 */
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

/**
 * Task with time tracking fields
 */
export interface TaskWithTimeTracking {
  id: string
  title: string
  description?: string

  // Time tracking
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
  invoice_period?: string

  // Project
  is_project: boolean
  parent_project_id?: string

  // Other fields
  status: string
  priority: string
  company_id: string
  created_at: string
  updated_at: string
}

/**
 * Time summary for a task or project
 */
export interface TimeSummary {
  estimated_minutes: number
  actual_minutes: number
  difference_minutes: number
  progress_percentage: number
  is_over_budget: boolean
  billable_minutes: number
  non_billable_minutes: number
}

/**
 * Billable summary
 */
export interface BillableSummary {
  billable_hours: number
  hourly_rate: number
  total_amount: number
  entries_count: number
}

/**
 * Monthly invoice data
 */
export interface MonthlyInvoiceData {
  period: string // "YYYY-MM"
  company_id: string
  company_name: string
  projects: ProjectInvoiceItem[]
  total_hours: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid'
}

/**
 * Project invoice item
 */
export interface ProjectInvoiceItem {
  id: string
  title: string
  billable_minutes: number
  hourly_rate: number
  amount: number
  entries: TimeTrackingEntry[]
}

/**
 * Time tracking statistics
 */
export interface TimeTrackingStats {
  total_tasks: number
  total_minutes: number
  billable_minutes: number
  non_billable_minutes: number
  total_amount: number
  average_task_duration: number
  tasks_over_budget: number
}

/**
 * Daily time summary
 */
export interface DailyTimeSummary {
  date: string
  total_minutes: number
  billable_minutes: number
  tasks_worked: number
  entries: TimeTrackingEntry[]
}

/**
 * Timer state
 */
export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  elapsedMinutes: number
  startTime: Date | null
  pausedTime: number
}

/**
 * Manual time entry form data
 */
export interface ManualTimeEntryData {
  minutes: number
  note: string
  billable: boolean
  date: string
  time: string
}

/**
 * Time tracking filter options
 */
export interface TimeTrackingFilters {
  user_id?: string
  task_id?: string
  project_id?: string
  billable?: boolean
  date_from?: string
  date_to?: string
  period?: string // "YYYY-MM"
}

/**
 * Invoice generation options
 */
export interface InvoiceGenerationOptions {
  company_id: string
  period: string
  include_non_billable?: boolean
  group_by_project?: boolean
  apply_discounts?: boolean
}

/**
 * Time tracking event types for timeline
 */
export type TimeTrackingEventType =
  | 'time_started'
  | 'time_stopped'
  | 'time_paused'
  | 'time_resumed'
  | 'time_logged'
  | 'time_edited'
  | 'time_deleted'
  | 'invoice_generated'

/**
 * Time tracking timeline event
 */
export interface TimeTrackingTimelineEvent {
  id: string
  event_type: TimeTrackingEventType
  task_id: string
  user_id: string
  user_name: string
  duration_minutes?: number
  billable?: boolean
  amount?: number
  created_at: string
}
