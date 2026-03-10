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
  | 'awaiting_approval'
  | 'completed'
  | 'cancelled'
  | 'someday_maybe'
  | 'invoiced';

export type GTDEnergyLevel = 'high' | 'medium' | 'low';
/** Alias for GTDEnergyLevel (used in some legacy imports) */
export type EnergyLevel = GTDEnergyLevel;

export type TaskType = 'base' | 'bonus';
export type BillingType = 'tariff' | 'extra' | 'free';

// R-Tasks Scoring System types
export type ScoreMoney = 0 | 1 | 2 | 3;      // 0=<5k, 1=5k+, 2=15k+, 3=50k+ Kč
export type ScoreFire = 0 | 1 | 2 | 3;       // 0=Easy, 1=Normal, 2=High, 3=Critical
export type ScoreTime = 0 | 1 | 2 | 3;       // 0=den+, 1=2-4h, 2=<1h, 3=<30min
export type ScoreDistance = 0 | 1 | 2;       // 0=Daleko, 1=Lokálně, 2=PC
export type ScorePersonal = 0 | 1;           // 0=Poor, 1=Good
export type ScorePriority = 'high' | 'medium' | 'low';  // Derived from total score
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';  // UI-facing priority level

export type GTDContext =
  | '@telefon'
  | '@email'
  | '@počítač'
  | '@pocitac'
  | '@kancelář'
  | '@kancelar'
  | '@venku'
  | '@internet'
  | '@meeting'
  | '@home'
  | '@anywhere';

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

  // Subtasks (populated by API)
  subtasks?: Task[];

  // Hierarchie (project/phase grouping)
  project_id?: string;
  project_name?: string;
  phase_id?: string;
  phase_name?: string;
  position_in_phase?: number;

  // Závislosti
  depends_on_task_ids?: string[];
  is_blocked?: boolean;

  // GTD next action flag
  is_next_action?: boolean;

  // Workflow
  status: TaskStatus;

  // Priority (string label, derived or manual)
  priority?: string;

  // Gamification
  task_type?: TaskType;
  points_value?: number;
  claimed_by?: string;
  claimed_by_name?: string;
  claimed_at?: string;

  // R-Tasks Scoring System (0-12 total)
  // Quick actions (<30 min) don't require scores
  score_money?: ScoreMoney;
  score_fire?: ScoreFire;
  score_time?: ScoreTime;
  score_distance?: ScoreDistance;
  score_personal?: ScorePersonal;
  total_score?: number;

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
  accepted?: boolean;
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

  // GTD location
  location_id?: string;

  // TIME TRACKING
  estimated_minutes?: number; // Odhad od zadavatele
  estimate_locked?: boolean;
  actual_minutes?: number; // Skutečný čas od realizátora
  time_tracking_started_at?: string; // Kdy začal pracovat

  // FAKTURACE
  is_billable: boolean; // Je to fakturovatelné klientovi?
  hourly_rate?: number; // Hodinová sazba (Kč/hod)
  billing_type?: BillingType;
  billable_hours?: number; // Vyfakturovatelné hodiny
  invoiced?: boolean;
  invoiced_at?: string;
  invoice_id?: string;
  invoiced_amount?: number; // Již vyfakturováno
  last_invoiced_at?: string; // Kdy naposledy fakturováno
  invoice_period?: string; // Fakturační období (2025-12)

  // GTD Specific
  gtd_context?: string[]; // Multiple contexts possible
  gtd_energy_level?: GTDEnergyLevel;
  gtd_is_quick_action?: boolean; // < 2 min! (ne 5)

  // Metadata
  tags?: string[];
  progress_percentage?: number; // 0-100
  task_data?: Record<string, any>; // Flexible JSON data

  // Approval workflow
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_by_name?: string;
  rejected_at?: string;
  rejection_comment?: string;
  rejection_count?: number;

  // Urgency & Escalation
  urgency_count?: number;
  last_urged_at?: string;
  escalated_to?: string;
  escalated_at?: string;
  escalation_reason?: string;
  auto_notifications_sent?: number;

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
  // R-Tasks scores (optional for quick actions <30min)
  score_money?: ScoreMoney;
  score_fire?: ScoreFire;
  score_time?: ScoreTime;
  score_distance?: ScoreDistance;
  score_personal?: ScorePersonal;
  created_by: string;
  created_by_name: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  due_time?: string;
  company_id?: string;
  company_name?: string;
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
  // GTD project & location refs
  project_id?: string;
  phase_id?: string;
  location_id?: string;
  position_in_phase?: number;
  is_next_action?: boolean;
}

// For updating tasks
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  // R-Tasks scores
  score_money?: ScoreMoney;
  score_fire?: ScoreFire;
  score_time?: ScoreTime;
  score_distance?: ScoreDistance;
  score_personal?: ScorePersonal;
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
  // GTD project & location refs
  project_id?: string | null;
  phase_id?: string | null;
  location_id?: string | null;
  position_in_phase?: number;
  is_next_action?: boolean;
  company_id?: string;
  company_name?: string;
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
  score_priority?: ScorePriority | ScorePriority[];  // Filter by R-Tasks derived priority
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
  project_id?: string;
  location_id?: string;
  is_next_action?: boolean;
}

export interface TaskSortOptions {
  field: 'created_at' | 'due_date' | 'score' | 'title' | 'status';
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

  // R-Tasks Scoring (optional for quick actions)
  score_money?: ScoreMoney;
  score_fire?: ScoreFire;
  score_time?: ScoreTime;
  score_distance?: ScoreDistance;
  score_personal?: ScorePersonal;

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
  by_score_priority: Record<ScorePriority, number>;  // Grouped by R-Tasks derived priority
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
  'awaiting_approval',
  'completed',
  'cancelled',
  'someday_maybe',
  'invoiced',
];

export const SCORE_PRIORITIES: ScorePriority[] = [
  'high',    // Score >= 9
  'medium',  // Score 6-8
  'low',     // Score < 6
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
  awaiting_approval: 'indigo',
  completed: 'green',
  cancelled: 'red',
  someday_maybe: 'purple',
  invoiced: 'green',
};

// Score-based priority colors for UI
export const SCORE_PRIORITY_COLORS: Record<ScorePriority, string> = {
  high: 'red',      // Score >= 9
  medium: 'yellow', // Score 6-8
  low: 'green',     // Score < 6
};

// Energy level colors for UI
export const GTD_ENERGY_COLORS: Record<GTDEnergyLevel, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'green',
};
