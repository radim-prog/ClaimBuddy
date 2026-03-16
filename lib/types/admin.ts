/**
 * Admin Types
 *
 * Types for admin features including:
 * - Team hierarchy management
 * - Notification configuration
 * - Document workflow routing
 */

// ============================================
// TEAM HIERARCHY
// ============================================

export type UserRole = 'admin' | 'manager' | 'senior' | 'accountant' | 'junior' | 'client'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  supervisor_id?: string // Manager/supervizor
  supervisors?: string[] // Multiple supervisors (for accountants)
  is_active: boolean
  created_at: string
  avatar_url?: string
}

export interface TeamHierarchyNode {
  member: TeamMember
  subordinates: TeamHierarchyNode[]
}

export interface SubstitutionRule {
  id: string
  user_id: string
  substitute_id: string
  type: 'vacation' | 'sick_leave' | 'permanent'
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  created_by: string
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

export type NotificationChannel = 'in_app' | 'email' | 'sms'

export type NotificationEventCategory =
  | 'task'
  | 'document'
  | 'onboarding'
  | 'deadline'
  | 'user'
  | 'invoicing'
  | 'company'

export interface NotificationEvent {
  id: string
  code: string // e.g., 'task.created', 'document.rejected'
  name: string
  description: string
  category: NotificationEventCategory
  is_system: boolean // System events cannot be deleted
  is_active: boolean
}

export interface NotificationRecipientType {
  type: 'role' | 'user' | 'supervisor' | 'client_owner' | 'assigned_accountant' | 'creator'
  value?: string // Role name or user ID
}

export interface NotificationRule {
  id: string
  event_id: string
  event_code: string
  recipients: NotificationRecipientType[]
  channels: NotificationChannel[]
  is_active: boolean
  conditions?: NotificationCondition[]
  created_at: string
  created_by: string
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string
}

export interface NotificationTemplate {
  id: string
  event_code: string
  channel: NotificationChannel
  subject?: string // For email
  body: string
  variables: string[] // Available template variables like {task_title}, {company_name}
}

// ============================================
// DOCUMENT WORKFLOW
// ============================================

export type DocumentWorkflowAction =
  | 'auto_approve'
  | 'require_manager_approval'
  | 'require_accountant_approval'
  | 'notify_only'
  | 'manual'

export interface DocumentType {
  id: string
  code: string
  name: string
  description?: string
  requires_approval: boolean
  default_action: DocumentWorkflowAction
}

export interface ClientWorkflowRule {
  id: string
  company_id: string
  company_name: string
  document_type_id?: string // null = applies to all document types
  action: DocumentWorkflowAction
  approver_id?: string // Specific approver if required
  notify_on_upload: boolean
  notify_on_approval: boolean
  is_active: boolean
  created_at: string
  created_by: string
}

export interface DocumentWorkflowConfig {
  id: string
  company_id: string
  enabled: boolean
  auto_categorize: boolean // Use AI to categorize documents
  default_action: DocumentWorkflowAction
  require_manager_override: boolean // Manager can always override
  rules: ClientWorkflowRule[]
}

// ============================================
// AUDIT LOGGING
// ============================================

export type AuditLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'unassign'

export interface AuditLogEntry {
  id: string
  user_id: string
  user_name: string
  action: AuditLogAction
  entity_type: string // 'task', 'document', 'company', etc.
  entity_id?: string
  entity_name?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

// ============================================
// MOCK DATA
// ============================================

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  // Task events
  { id: '1', code: 'task.created', name: 'Nový úkol vytvořen', description: 'Když je vytvořen nový úkol', category: 'task', is_system: true, is_active: true },
  { id: '2', code: 'task.assigned', name: 'Úkol přiřazen', description: 'Když je úkol přiřazen někomu', category: 'task', is_system: true, is_active: true },
  { id: '3', code: 'task.status_changed', name: 'Změna stavu úkolu', description: 'Když se změní stav úkolu', category: 'task', is_system: true, is_active: true },
  { id: '4', code: 'task.completed', name: 'Úkol dokončen', description: 'Když je úkol označen jako dokončený', category: 'task', is_system: true, is_active: true },
  { id: '5', code: 'task.overdue', name: 'Úkol po termínu', description: 'Když úkol překročí deadline', category: 'task', is_system: true, is_active: true },
  { id: '6', code: 'task.comment_added', name: 'Nový komentář', description: 'Když je přidán komentář k úkolu', category: 'task', is_system: true, is_active: true },
  { id: '7', code: 'task.delegated', name: 'Úkol delegován', description: 'Když je úkol delegován na někoho jiného', category: 'task', is_system: true, is_active: true },
  { id: '8', code: 'task.deadline_reminder', name: 'Připomínka deadlinu', description: 'Automatická připomínka před deadlinem', category: 'task', is_system: true, is_active: true },

  // Document events
  { id: '9', code: 'document.uploaded', name: 'Dokument nahrán', description: 'Když klient nahraje nový dokument', category: 'document', is_system: true, is_active: true },
  { id: '10', code: 'document.approved', name: 'Dokument schválen', description: 'Když je dokument schválen', category: 'document', is_system: true, is_active: true },
  { id: '11', code: 'document.rejected', name: 'Dokument zamítnut', description: 'Když je dokument zamítnut', category: 'document', is_system: true, is_active: true },

  // Onboarding events
  { id: '12', code: 'onboarding.started', name: 'Onboarding zahájen', description: 'Když je vytvořen nový klient v onboardingu', category: 'onboarding', is_system: true, is_active: true },
  { id: '13', code: 'onboarding.step_completed', name: 'Krok onboardingu dokončen', description: 'Když je dokončen krok onboardingu', category: 'onboarding', is_system: true, is_active: true },
  { id: '14', code: 'onboarding.completed', name: 'Onboarding dokončen', description: 'Když je onboarding plně dokončen', category: 'onboarding', is_system: true, is_active: true },
  { id: '15', code: 'onboarding.stalled', name: 'Onboarding zaseknutý', description: 'Když onboarding nepokročil X dní', category: 'onboarding', is_system: true, is_active: true },

  // Deadline events
  { id: '16', code: 'deadline.upcoming', name: 'Blížící se deadline', description: 'Upozornění na blížící se deadline', category: 'deadline', is_system: true, is_active: true },
  { id: '17', code: 'deadline.today', name: 'Deadline dnes', description: 'Deadline je dnes', category: 'deadline', is_system: true, is_active: true },
  { id: '18', code: 'deadline.missed', name: 'Zmeškaný deadline', description: 'Deadline byl zmeškaný', category: 'deadline', is_system: true, is_active: true },
  { id: '19', code: 'monthly_closure.reminder', name: 'Připomínka uzávěrky', description: 'Připomínka měsíční uzávěrky', category: 'deadline', is_system: true, is_active: true },
  { id: '20', code: 'monthly_closure.overdue', name: 'Uzávěrka po termínu', description: 'Měsíční uzávěrka je po termínu', category: 'deadline', is_system: true, is_active: true },

  // User events
  { id: '21', code: 'user.created', name: 'Nový uživatel', description: 'Když je vytvořen nový uživatel', category: 'user', is_system: true, is_active: true },
  { id: '22', code: 'user.role_changed', name: 'Změna role uživatele', description: 'Když se změní role uživatele', category: 'user', is_system: true, is_active: true },
  { id: '23', code: 'user.deactivated', name: 'Uživatel deaktivován', description: 'Když je uživatel deaktivován', category: 'user', is_system: true, is_active: true },
  { id: '24', code: 'user.substitution_active', name: 'Aktivní zastoupení', description: 'Když začíná zastoupení (dovolená)', category: 'user', is_system: true, is_active: true },

  // Invoicing events
  { id: '25', code: 'invoice.generated', name: 'Faktura vygenerována', description: 'Když je vygenerována faktura', category: 'invoicing', is_system: true, is_active: true },
  { id: '26', code: 'invoice.sent', name: 'Faktura odeslána', description: 'Když je faktura odeslána klientovi', category: 'invoicing', is_system: true, is_active: true },
  { id: '27', code: 'invoice.paid', name: 'Faktura zaplacena', description: 'Když je faktura označena jako zaplacená', category: 'invoicing', is_system: true, is_active: true },
  { id: '28', code: 'invoice.overdue', name: 'Faktura po splatnosti', description: 'Když je faktura po splatnosti', category: 'invoicing', is_system: true, is_active: true },

  // Company events
  { id: '29', code: 'company.accountant_changed', name: 'Změna účetní', description: 'Když se změní přiřazená účetní', category: 'company', is_system: true, is_active: true },
  { id: '30', code: 'company.settings_changed', name: 'Změna nastavení klienta', description: 'Když se změní nastavení klienta', category: 'company', is_system: true, is_active: true },
]

export const DOCUMENT_TYPES: DocumentType[] = [
  { id: '1', code: 'invoice_received', name: 'Přijatá faktura', requires_approval: false, default_action: 'auto_approve' },
  { id: '2', code: 'invoice_issued', name: 'Vydaná faktura', requires_approval: false, default_action: 'auto_approve' },
  { id: '3', code: 'bank_statement', name: 'Bankovní výpis', requires_approval: false, default_action: 'auto_approve' },
  { id: '4', code: 'contract', name: 'Smlouva', requires_approval: true, default_action: 'require_manager_approval' },
  { id: '5', code: 'payroll', name: 'Mzdový doklad', requires_approval: true, default_action: 'require_accountant_approval' },
  { id: '6', code: 'tax_document', name: 'Daňový doklad', requires_approval: true, default_action: 'require_manager_approval' },
  { id: '7', code: 'other', name: 'Ostatní', requires_approval: false, default_action: 'notify_only' },
]

// MOCK data removed - all admin pages now fetch from API routes:
// /api/accountant/admin/team (users)
// /api/accountant/admin/substitutions
// /api/accountant/admin/notification-rules
// /api/accountant/admin/workflow-rules
