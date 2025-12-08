// ============================================
// TASK MANAGEMENT - TypeScript Types
// ============================================
// Created: 2025-12-07
// Purpose: TypeScript interfaces for GTD-based task management system
// ============================================

// ============================================
// ENUMS & TYPES
// ============================================

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
  | 'invoiced';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type GTDEnergyLevel = 'high' | 'medium' | 'low';

export type GTDContext =
  | '@telefon'
  | '@email'
  | '@počítač'
  | '@kancelář'
  | '@venku'
  | '@internet'
  | '@meeting'
  | '@home';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type TimelineEventType =
  | 'task_created'
  | 'task_assigned'
  | 'task_accepted'
  | 'task_started'
  | 'task_completed'
  | 'task_delegated'
  | 'project_created'
  | 'project_milestone'
  | 'time_logged'
  | 'invoice_generated';

// ============================================
// MAIN TASK INTERFACE
// ============================================

export interface Task {
  id: string;

  // Základní info
  title: string;
  description?: string;

  // GTD: Task vs. Project
  is_project: boolean;
  project_outcome?: string;
  parent_project_id?: string;

  // Workflow
  status: TaskStatus;
  priority: TaskPriority;

  // Assignování & Delegování
  created_by: string;
  created_by_name: string;
  assigned_to?: string;
  assigned_to_name?: string;
  delegated_from?: string;
  delegated_to?: string;
  delegation_reason?: string;

  // Waiting For
  is_waiting_for: boolean;
  waiting_for_who?: string;
  waiting_for_what?: string;
  last_reminded_at?: string;

  // Acceptance
  accepted: boolean;
  accepted_at?: string;

  // Deadline
  due_date?: string; // DATE
  due_time?: string; // TIME

  // Vazby (VŽDY company_id!)
  company_id: string;
  company_name: string;
  monthly_closure_id?: string;
  document_id?: string;
  onboarding_client_id?: string;

  // TIME TRACKING
  estimated_minutes?: number; // Odhad od zadavatele
  actual_minutes: number; // Skutečný čas od realizátora
  time_tracking_started_at?: string; // Kdy začal pracovat

  // FAKTURACE
  is_billable: boolean; // Je to fakturovatelné klientovi?
  hourly_rate?: number; // Hodinová sazba (Kč/hod)
  billable_hours: number; // Vyfakturovatelné hodiny
  invoiced_amount: number; // Již vyfakturováno
  last_invoiced_at?: string; // Kdy naposledy fakturováno
  invoice_period?: string; // Fakturační období (2025-12)

  // GTD Specific
  gtd_context?: string[]; // Multiple contexts possible
  gtd_energy_level?: GTDEnergyLevel;
  gtd_is_quick_action: boolean; // < 2 min! (ne 5)

  // Metadata
  tags?: string[];
  progress_percentage: number; // 0-100
  task_data?: Record<string, any>; // Flexible JSON data

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================
// TIME TRACKING ENTRY
// ============================================

export interface TimeTrackingEntry {
  id: string;
  task_id?: string;
  checklist_item_id?: string;

  user_id: string;
  user_name: string;
  started_at: string;
  stopped_at?: string;
  duration_minutes?: number; // Automaticky vypočítáno
  note?: string; // Co dělal
  billable: boolean; // Je to fakturovatelné?

  created_at: string;
}

// ============================================
// TASK CHECKLIST ITEM
// ============================================

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  text: string;
  position: number;
  completed: boolean;

  // Deadline & assignování
  due_date?: string; // DATE
  due_time?: string; // TIME
  assigned_to?: string;
  assigned_to_name?: string;

  // Time tracking pro každý krok
  estimated_minutes?: number;
  actual_minutes: number;

  // GTD
  gtd_context?: string;

  // Completion tracking
  completed_by?: string;
  completed_at?: string;

  created_at: string;
}

// ============================================
// TASK INVOICE
// ============================================

export interface TaskInvoice {
  id: string;
  task_id?: string;
  company_id: string;

  invoice_period: string; // '2025-12'
  total_hours: number;
  hourly_rate: number;
  total_amount: number;

  status: InvoiceStatus;
  generated_at: string;
  sent_at?: string;
  paid_at?: string;

  invoice_data?: InvoiceData; // Detailní rozpis
}

export interface InvoiceData {
  items: InvoiceLineItem[];
  notes?: string;
  client_info?: {
    name: string;
    ico?: string;
    address?: string;
  };
}

export interface InvoiceLineItem {
  task_id: string;
  task_title: string;
  description?: string;
  hours: number;
  rate: number;
  amount: number;
}

// ============================================
// TIMELINE EVENT (integrace s demo)
// ============================================

export interface TaskTimelineEvent {
  id: string;
  company_id: string; // Pro zobrazení v timeline klienta
  task_id?: string;
  project_id?: string;

  event_type: TimelineEventType;
  event_data: Record<string, any>;
  created_by: string;
  created_by_name: string;
  created_at: string;

  // Pro zobrazení v timeline
  display_title: string; // "Radim dokončil úkol: Poslat email"
  display_icon: string; // '✅' nebo 'CheckCircle'
  display_color: string; // 'green', 'blue', atd.
}

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

// Task with populated relations
export interface TaskWithRelations extends Task {
  subtasks?: Task[];
  checklist_items?: TaskChecklistItem[];
  time_entries?: TimeTrackingEntry[];
  parent_project?: Task;
  invoices?: TaskInvoice[];
}

// Time tracking entry with task info
export interface TimeTrackingEntryWithTask extends TimeTrackingEntry {
  task?: Task;
  checklist_item?: TaskChecklistItem;
}

// ============================================
// DATABASE INSERT/UPDATE TYPES
// ============================================

// For creating new tasks
export interface CreateTaskInput {
  title: string;
  description?: string;
  is_project?: boolean;
  project_outcome?: string;
  parent_project_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  created_by: string;
  created_by_name: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  due_time?: string;
  company_id: string;
  company_name: string;
  monthly_closure_id?: string;
  document_id?: string;
  onboarding_client_id?: string;
  estimated_minutes?: number;
  is_billable?: boolean;
  hourly_rate?: number;
  gtd_context?: string[];
  gtd_energy_level?: GTDEnergyLevel;
  gtd_is_quick_action?: boolean;
  tags?: string[];
  task_data?: Record<string, any>;
}

// For updating tasks
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  delegated_from?: string;
  delegated_to?: string;
  delegation_reason?: string;
  is_waiting_for?: boolean;
  waiting_for_who?: string;
  waiting_for_what?: string;
  accepted?: boolean;
  accepted_at?: string;
  due_date?: string;
  due_time?: string;
  estimated_minutes?: number;
  is_billable?: boolean;
  hourly_rate?: number;
  gtd_context?: string[];
  gtd_energy_level?: GTDEnergyLevel;
  gtd_is_quick_action?: boolean;
  tags?: string[];
  progress_percentage?: number;
  task_data?: Record<string, any>;
  completed_at?: string;
}

// For creating time tracking entries
export interface CreateTimeTrackingInput {
  task_id?: string;
  checklist_item_id?: string;
  user_id: string;
  user_name: string;
  started_at: string;
  stopped_at?: string;
  note?: string;
  billable?: boolean;
}

// For creating checklist items
export interface CreateChecklistItemInput {
  task_id: string;
  text: string;
  position?: number;
  due_date?: string;
  due_time?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  estimated_minutes?: number;
  gtd_context?: string;
}

// For creating invoices
export interface CreateTaskInvoiceInput {
  task_id?: string;
  company_id: string;
  invoice_period: string;
  total_hours: number;
  hourly_rate: number;
  total_amount: number;
  invoice_data?: InvoiceData;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface TaskResponse {
  task: TaskWithRelations;
}

export interface TimeTrackingResponse {
  entries: TimeTrackingEntry[];
  total_duration: number;
  billable_duration: number;
}

export interface BillableSummary {
  total_hours: number;
  total_amount: number;
  tasks_count: number;
  invoiced_amount: number;
  pending_amount: number;
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigned_to?: string;
  created_by?: string;
  company_id?: string;
  is_project?: boolean;
  is_billable?: boolean;
  gtd_context?: string[];
  gtd_energy_level?: GTDEnergyLevel;
  gtd_is_quick_action?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  parent_project_id?: string;
  search?: string;
}

export interface TaskSortOptions {
  field: 'created_at' | 'due_date' | 'priority' | 'title' | 'status';
  direction: 'asc' | 'desc';
}

// ============================================
// GTD WIZARD TYPES
// ============================================

export interface GTDWizardStep {
  step: number;
  title: string;
  description: string;
  field?: keyof Task;
  options?: Array<{
    value: any;
    label: string;
    description?: string;
  }>;
}

export interface GTDWizardData {
  // Step 1: Clarify
  title: string;
  description?: string;
  is_project: boolean;
  project_outcome?: string;

  // Step 2: 2-minute rule
  gtd_is_quick_action: boolean;

  // Step 3: Organize - Delegate or Do?
  assigned_to?: string;
  assigned_to_name?: string;

  // Step 4a: Context & Energy
  gtd_context?: string[];
  gtd_energy_level?: GTDEnergyLevel;

  // Step 4b: Time estimate
  estimated_minutes?: number;

  // Step 5: Billable?
  is_billable: boolean;
  hourly_rate?: number;

  // Step 6: When?
  due_date?: string;
  due_time?: string;
  priority: TaskPriority;

  // Company info
  company_id: string;
  company_name: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface TaskStatistics {
  total: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
  quick_actions: number;
  waiting_for: number;
  projects: number;
  billable_hours: number;
  billable_amount: number;
}

export interface ProjectProgress {
  project_id: string;
  project_title: string;
  total_subtasks: number;
  completed_subtasks: number;
  progress_percentage: number;
  estimated_hours: number;
  actual_hours: number;
  remaining_hours: number;
}

// ============================================
// CONSTANTS
// ============================================

export const TASK_STATUSES: TaskStatus[] = [
  'draft',
  'pending',
  'clarifying',
  'accepted',
  'in_progress',
  'waiting_for',
  'waiting_client',
  'completed',
  'cancelled',
  'someday_maybe',
  'invoiced',
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'critical',
  'high',
  'medium',
  'low',
];

export const GTD_ENERGY_LEVELS: GTDEnergyLevel[] = ['high', 'medium', 'low'];

export const GTD_CONTEXTS: GTDContext[] = [
  '@telefon',
  '@email',
  '@počítač',
  '@kancelář',
  '@venku',
  '@internet',
  '@meeting',
  '@home',
];

export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid'];

// Status colors for UI
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  draft: 'gray',
  pending: 'yellow',
  clarifying: 'blue',
  accepted: 'cyan',
  in_progress: 'blue',
  waiting_for: 'orange',
  waiting_client: 'orange',
  completed: 'green',
  cancelled: 'red',
  someday_maybe: 'purple',
  invoiced: 'green',
};

// Priority colors for UI
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
};

// Energy level colors for UI
export const GTD_ENERGY_COLORS: Record<GTDEnergyLevel, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'green',
};
