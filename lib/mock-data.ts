// Mock data pro testování UI - REÁLNÁ DATA Z POHODY
// Automaticky generováno z Pohoda MDB databází

import { TaskTimelineEvent } from '@/lib/types/tasks'
import { pohodaCompanies, POHODA_STATS } from '@/lib/pohoda-real-data'

// ============================================
// HELPER FUNKCE PRO DYNAMICKÁ DATA
// ============================================

// Generuje datum relativně k dnešku
function getRelativeDate(daysOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

// Konstanty pro relativní data (použijeme v mockTasks)
export const MOCK_DATES = {
  // Po termínu
  OVERDUE_3_DAYS: getRelativeDate(-3),
  OVERDUE_2_DAYS: getRelativeDate(-2),
  OVERDUE_1_DAY: getRelativeDate(-1),
  // Aktuální
  TODAY: getRelativeDate(0),
  TOMORROW: getRelativeDate(1),
  IN_2_DAYS: getRelativeDate(2),
  IN_3_DAYS: getRelativeDate(3),
  IN_4_DAYS: getRelativeDate(4),
  // Budoucí
  IN_5_DAYS: getRelativeDate(5),
  IN_7_DAYS: getRelativeDate(7),
  IN_14_DAYS: getRelativeDate(14),
  IN_30_DAYS: getRelativeDate(30),
  END_OF_MONTH: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1, 0) // Poslední den aktuálního měsíce
    return d.toISOString().split('T')[0]
  })(),
  END_OF_NEXT_MONTH: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 2, 0) // Poslední den příštího měsíce
    return d.toISOString().split('T')[0]
  })(),
}

// ============================================
// CENTRÁLNÍ KONFIGURACE MOCK DAT
// ============================================

// Aktuální období (pro fakturaci, uzávěrky atd.)
function getCurrentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MOCK_CONFIG = {
  // Aktuální období (dynamicky generováno)
  CURRENT_PERIOD: getCurrentPeriod(),
  PREVIOUS_PERIOD: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })(),

  // Limity pro zobrazení
  COMPANIES_DROPDOWN_LIMIT: 10,      // Limit firem v dropdownu
  COMPANIES_CLIENT_VIEW_LIMIT: 3,     // Limit firem pro klientský pohled
  TASKS_PAGE_SIZE: 50,                // Počet úkolů na stránku
  RECENT_COMPLETED_LIMIT: 5,          // Počet nedávno dokončených úkolů

  // ID aktuálního uživatele (účetní)
  CURRENT_USER_ID: 'user-2-accountant',
  CURRENT_USER_NAME: 'Jana Svobodová',

  // Prahy pro quick actions (v minutách)
  QUICK_ACTION_THRESHOLD: 30,         // Úkoly pod 30 min = quick action
  GTD_DO_IT_NOW_THRESHOLD: 2,         // Úkoly pod 2 min = udělej hned

  // Prahy pro R-Tasks prioritu
  SCORE_HIGH_THRESHOLD: 9,            // Score >= 9 = vysoká priorita
  SCORE_MEDIUM_THRESHOLD: 6,          // Score >= 6 = střední priorita

  // Rok odkdy začínají data (pro year selector)
  DATA_START_YEAR: new Date().getFullYear(),  // Aktuální rok jako minimum
  CURRENT_YEAR: new Date().getFullYear(),
}
import { Employee, Deduction } from '@/lib/types/employee'
import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'
import { ClientOnboarding, ClientStatus, DEFAULT_ONBOARDING_STEPS } from '@/lib/types/onboarding'

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
    name: 'Jana Svobodová',
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

// REÁLNÁ DATA: 122 firem importovaných z Pohoda MDB databází
export const mockCompanies = pohodaCompanies as any[]


// Mock documents (30 ukázkových dokumentů)
const documentTypes = ['receipt', 'bank_statement', 'expense_invoice', 'income_invoice'] as const
const fileExamples = {
  receipt: ['uctenka-potraviny.jpg', 'uctenka-benzin.jpg', 'uctenka-kancelare.pdf'],
  bank_statement: ['vypis-leden.pdf', 'vypis-unor.pdf', 'vypis-brezen.pdf'],
  expense_invoice: ['faktura-dodavatel.pdf', 'faktura-sluzby.pdf', 'faktura-material.pdf'],
  income_invoice: ['faktura-odberatel.pdf', 'faktura-zakaznik.pdf', 'faktura-prodej.pdf'],
}

export const mockDocuments: any[] = []

// Task types with GTD methodology
export type TaskStatus =
  | 'pending'           // Inbox - nový, netříděný
  | 'clarifying'        // Inbox - vyžaduje upřesnění
  | 'accepted'          // K práci - přijato
  | 'in_progress'       // Probíhá - pracuje se
  | 'waiting_for'       // Čeká interně
  | 'waiting_client'    // Čeká na klienta
  | 'awaiting_approval' // Čeká na schválení manažerem
  | 'completed'         // Hotovo (schváleno)
  | 'invoiced'          // Vyfakturováno
  | 'cancelled'         // Zrušeno
  | 'someday_maybe'     // Někdy/Možná

export type TaskType = 'base' | 'bonus'
export type BillingType = 'tariff' | 'extra' | 'free'
  // tariff = pokryto měsíčním paušálem klienta
  // extra  = fakturuje se zvlášť (hodinová sazba)
  // free   = zdarma (interní, reklamace, goodwill)

export type GTDContext = '@email' | '@telefon' | '@pocitac' | '@kancelar' | '@meeting' | '@anywhere'
export type EnergyLevel = 'high' | 'medium' | 'low'

// ============================================
// TIME LOGGING
// ============================================
export type ActivityType = 'task' | 'general' | 'admin' | 'meeting' | 'call' | 'email'

export interface TimeLog {
  id: string
  task_id?: string       // Optional - null for non-task time
  user_id: string
  user_name: string
  client_id?: string     // For non-task time logs
  client_name?: string
  activity_type: ActivityType
  date: string           // YYYY-MM-DD
  minutes: number
  description: string
  is_billable: boolean
  created_at: string
}

// ============================================
// USER TASK SETTINGS (WIP limits, quality)
// ============================================
export interface UserTaskSettings {
  user_id: string
  user_name: string

  // WIP Limits (nastavuje admin)
  max_wip_total: number       // Max rozpracovaných celkem
  max_wip_bonus: number       // Max rozpracovaných BONUS úkolů
  can_claim_bonus: boolean    // Může claimovat bonus úkoly?

  // Quality Score (skrytý, počítá systém)
  quality_score: number       // 0-100, účetní nevidí
  quality_factors: {
    on_time_rate: number      // % úkolů dokončených včas
    no_rejection_rate: number // % úkolů bez vrácení
    estimate_accuracy: number // Přesnost odhadů
  }

  // Monthly Stats
  current_month: string       // YYYY-MM
  monthly_base_required: number
  monthly_base_completed: number
  monthly_bonus_points: number
  monthly_bonus_cashed_out: boolean
}

// ============================================
// TASK APPROVAL
// ============================================
export interface TaskApproval {
  id: string
  task_id: string
  action: 'approved' | 'rejected'
  by_user_id: string
  by_user_name: string
  comment?: string
  created_at: string
}

// ============================================
// SYSTEM SETTINGS (admin configurable)
// ============================================
export interface TaskSystemSettings {
  monthly_cutoff_day: number        // Default: 5
  approval_deadline_hours: number   // Default: 24
  min_quality_for_bonus: number     // Default: 80
  points_to_currency_rate: number   // Default: 1 (1 bod = 1 Kč)
}

// ============================================
// CLIENT REQUESTS (požadavky od klientů)
// ============================================
export type ClientRequestStatus = 'new' | 'reviewed' | 'in_progress' | 'completed' | 'rejected'
export type ClientRequestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ClientRequestCategory = 'accounting' | 'tax' | 'payroll' | 'consulting' | 'documents' | 'other'

export interface ClientRequest {
  id: string
  client_id: string
  client_name: string

  // Request details
  title: string
  description: string
  category: ClientRequestCategory
  priority: ClientRequestPriority
  status: ClientRequestStatus

  // Attachments (file URLs)
  attachments?: string[]

  // Assignment
  assigned_to?: string      // user_id
  assigned_to_name?: string

  // Related task (if request was converted to task)
  related_task_id?: string

  // Dates
  requested_by_date?: string  // Client's requested deadline
  created_at: string
  updated_at: string
  resolved_at?: string

  // Communication
  internal_notes?: string     // Not visible to client
  response_to_client?: string // Visible to client
}

// ============================================
// PROJECT (kontejner pro fáze a úkoly)
// ============================================
export type ProjectType = 'recurring' | 'one_time' | 'ongoing'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'

export interface Project {
  id: string
  title: string
  description?: string
  outcome: string                    // GTD: Požadovaný výsledek

  // Vztah ke klientovi
  company_id: string
  company_name: string

  // Typ projektu
  project_type: ProjectType

  // Pro opakující se projekty
  recurrence?: {
    pattern: 'monthly' | 'quarterly' | 'yearly'
    period_label: string             // "12/2024", "Q4/2024", "2024"
    template_id?: string
  }

  // Časové rozpětí
  start_date?: string
  target_date: string
  actual_end_date?: string

  // Stav
  status: ProjectStatus

  // Vlastnictví
  owner_id: string
  owner_name: string
  team_ids: string[]
  team_names: string[]

  // GTD
  next_action_id?: string
  is_someday_maybe: boolean

  // Priority (dědí se do úkolů projektu)
  priority?: 0 | 1 | 2 | 3  // 0=low, 1=normal, 2=high, 3=critical

  // Finance
  is_billable: boolean
  budget_hours?: number
  hourly_rate?: number

  // Počítané hodnoty
  total_tasks?: number
  completed_tasks?: number
  progress_percent?: number

  // Tracking
  created_at: string
  updated_at: string
}

// ============================================
// PHASE (fáze v projektu)
// ============================================
export type PhaseStatus = 'pending' | 'active' | 'completed'

export interface Phase {
  id: string
  project_id: string

  title: string
  description?: string
  position: number                   // Pořadí v projektu (1, 2, 3...)

  // Stav
  status: PhaseStatus

  // Časový rámec (volitelný)
  start_date?: string
  target_date?: string

  // Počítané hodnoty
  total_tasks?: number
  completed_tasks?: number
  progress_percent?: number

  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string

  // === HIERARCHIE (volitelné - NULL = volný úkol) ===
  project_id?: string               // ID projektu
  project_name?: string
  phase_id?: string                 // ID fáze v projektu
  phase_name?: string
  position_in_phase?: number        // Pořadí ve fázi

  // === ZÁVISLOSTI ===
  depends_on_task_ids?: string[]    // Úkoly které musí být hotové první
  is_blocked?: boolean              // Computed: má nesplněné závislosti?

  // === GTD FLAGS ===
  is_next_action?: boolean          // Toto je Next Action projektu

  // === LEGACY (zpětná kompatibilita) ===
  is_project: boolean               // DEPRECATED: použij Project entitu
  project_outcome?: string          // DEPRECATED
  parent_project_id?: string        // DEPRECATED: použij project_id

  // Workflow
  status: TaskStatus

  // === GAMIFICATION: Task Type ===
  task_type?: TaskType            // 'base' (default) | 'bonus'
  points_value?: number           // Bodová hodnota (jen pro bonus, nastavuje admin)

  // === GAMIFICATION: Claim (pro bonus úkoly) ===
  claimed_by?: string             // User ID kdo si claimnul
  claimed_by_name?: string
  claimed_at?: string

  // Assignment
  created_by: string
  created_by_name: string
  assigned_to?: string
  assigned_to_name?: string

  // Waiting for
  is_waiting_for: boolean
  waiting_for_who?: string
  waiting_for_what?: string

  // Deadline
  due_date: string
  due_time?: string

  // Client relationship
  company_id: string
  company_name: string

  // GTD Specific
  gtd_context?: GTDContext[]
  gtd_energy_level?: EnergyLevel
  gtd_is_quick_action?: boolean  // < 2 min

  // === GAMIFICATION: Time Tracking ===
  estimated_minutes?: number      // Odhad při vytvoření (LOCKED po vytvoření)
  estimate_locked?: boolean       // true = nelze měnit estimate (default: true po vytvoření)
  actual_minutes?: number         // Skutečný čas (vyplní se před uzavřením)

  // Billing
  is_billable: boolean
  hourly_rate?: number
  billing_type?: BillingType       // tariff = paušál, extra = fakturovat zvlášť, free = zdarma
  invoiced?: boolean               // Byl úkol již fakturován?
  invoiced_at?: string             // Kdy byl fakturován (ISO date)
  invoice_id?: string              // ID faktury (vazba na Invoice entitu)

  // Metadata
  tags?: string[]
  progress_percentage?: number

  // R-Tasks Scoring System (0-12 total)
  score_money?: 0 | 1 | 2 | 3        // 0 = <5k, 1 = 5k+, 2 = 15k+, 3 = 50k+ Kč
  score_fire?: 0 | 1 | 2 | 3         // 0 = Easy, 1 = Normal, 2 = High, 3 = Critical
  score_time?: 0 | 1 | 2 | 3         // 0 = den+, 1 = 2-4h, 2 = <1h, 3 = <30min
  score_distance?: 0 | 1 | 2         // 0 = Daleko, 1 = Lokálně, 2 = PC
  score_personal?: 0 | 1             // 0 = Poor, 1 = Good

  // === GAMIFICATION: Approval ===
  approved_by?: string
  approved_by_name?: string
  approved_at?: string
  rejected_by?: string
  rejected_by_name?: string
  rejected_at?: string
  rejection_comment?: string
  rejection_count?: number          // Kolikrát byl úkol vrácen (default: 0)

  // === URGENCY & ESCALATION ===
  urgency_count?: number            // Kolikrát bylo urgováno (0-5)
  last_urged_at?: string            // Datum poslední urgence
  escalated_to?: string             // ID manažera (pokud eskalováno)
  escalated_at?: string             // Kdy eskalováno
  escalation_reason?: string        // Důvod eskalace
  auto_notifications_sent?: number  // Počet automatických notifikací

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// ============================================
// INVOICE SYSTEM (Fakturace)
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type InvoiceType = 'accountant_to_client' | 'client_to_customer'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string                   // 'hod', 'ks', 'měs'
  unit_price: number
  vat_rate: number               // 0, 12, 21
  total_without_vat: number
  total_with_vat: number
  task_id?: string               // Propojení na task (volitelné)
}

export interface Invoice {
  id: string
  type: InvoiceType
  company_id: string
  company_name: string

  // Číslo faktury
  invoice_number: string
  variable_symbol: string

  // Datumy
  issue_date: string
  due_date: string
  tax_date: string

  // Odběratel (pro client_to_customer)
  customer?: {
    name: string
    ico?: string
    dic?: string
    address: string
  }

  // Položky
  items: InvoiceItem[]

  // Částky
  total_without_vat: number
  total_vat: number
  total_with_vat: number

  // Status
  status: InvoiceStatus
  paid_at?: string

  // Propojení
  task_ids: string[]             // Úkoly zahrnuté ve faktuře
  pohoda_id?: string             // ID v Pohodě (po exportu)

  // Metadata
  created_at: string
  created_by: string
  updated_at: string
}

// Invoice counter for generating invoice numbers
let invoiceCounter = 1

// Helper: Generovat číslo faktury
export function generateInvoiceNumber(type: InvoiceType): string {
  const year = new Date().getFullYear()
  const prefix = type === 'accountant_to_client' ? 'FV' : 'FA'
  const number = String(invoiceCounter++).padStart(4, '0')
  return `${prefix}-${year}-${number}`
}

// Helper: Získat nefakturované úkoly pro klienta (extra billing_type, completed, not invoiced)
export function getUninvoicedTasksForCompany(companyId: string): Task[] {
  return mockTasks.filter(task =>
    task.company_id === companyId &&
    task.status === 'completed' &&
    task.is_billable === true &&
    task.billing_type === 'extra' &&
    !task.invoiced
  )
}

// Helper: Získat všechny fakturovatelné úkoly (completed, billable, extra type)
export function getAllBillableTasks(): Task[] {
  return mockTasks.filter(task =>
    task.status === 'completed' &&
    task.is_billable === true &&
    task.billing_type === 'extra' &&
    !task.invoiced
  )
}

// Type alias for Company from mockCompanies
type MockCompany = typeof mockCompanies[number]

// Helper: Seskupit fakturovatelné úkoly podle klienta
export function getBillableTasksByCompany(): Record<string, { company: MockCompany, tasks: Task[], totalHours: number, totalAmount: number }> {
  const billableTasks = getAllBillableTasks()
  const grouped: Record<string, { company: MockCompany, tasks: Task[], totalHours: number, totalAmount: number }> = {}

  billableTasks.forEach(task => {
    if (!grouped[task.company_id]) {
      const company = mockCompanies.find(c => c.id === task.company_id)
      if (company) {
        grouped[task.company_id] = {
          company,
          tasks: [],
          totalHours: 0,
          totalAmount: 0
        }
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

// Helper: Vytvořit fakturu z vybraných tasků
export function createInvoiceFromTasks(
  taskIds: string[],
  type: InvoiceType = 'accountant_to_client'
): Invoice | null {
  const tasks = mockTasks.filter(t => taskIds.includes(t.id))
  if (tasks.length === 0) return null

  const firstTask = tasks[0]
  const company = mockCompanies.find(c => c.id === firstTask.company_id)
  if (!company) return null

  // Create invoice items from tasks
  const items: InvoiceItem[] = tasks.map((task, index) => {
    const hours = (task.actual_minutes || task.estimated_minutes || 0) / 60
    const unitPrice = task.hourly_rate || 800
    const totalWithoutVat = hours * unitPrice
    const vatRate = 21
    const totalWithVat = totalWithoutVat * (1 + vatRate / 100)

    return {
      id: `item-${index + 1}`,
      description: task.title,
      quantity: Math.round(hours * 100) / 100, // Round to 2 decimals
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
  // Type assertion for billing_settings which may not exist on all company types
  const billingSettings = (company as unknown as { billing_settings?: { invoice_maturity?: number } }).billing_settings
  dueDate.setDate(dueDate.getDate() + (billingSettings?.invoice_maturity || 14))

  const invoiceNumber = generateInvoiceNumber(type)
  const variableSymbol = invoiceNumber.replace(/[^0-9]/g, '')

  const invoice: Invoice = {
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

  return invoice
}

// Helper: Označit úkoly jako fakturované
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

// Mock invoices
export const mockInvoices: Invoice[] = []

// Tasks - prázdné, generují se přes šablony na vyžádání uživatele
export const mockTasks: Task[] = []

// ============================================
// TASK TIMELINE EVENTS (Mock)
// ============================================

export const mockTaskTimelineEvents: TaskTimelineEvent[] = []

// Helper funkce pro získání dat
export function getCompaniesByAccountant(accountantId: string) {
  return mockCompanies.filter(c => c.assigned_accountant_id === accountantId)
}

export function getTaskTimelineByCompany(companyId: string) {
  return mockTaskTimelineEvents.filter(e => e.company_id === companyId)
}

export function getAllTimelineEvents(companyId: string) {
  // Combine task timeline events with other potential timeline events
  // For now, just return task events sorted by date
  return mockTaskTimelineEvents
    .filter(e => e.company_id === companyId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get tasks by company
export function getTasksByCompany(companyId: string) {
  return mockTasks.filter(t => t.company_id === companyId)
}

// Get all tasks (including bonus tasks and project tasks)
export function getAllTasks() {
  return [...mockTasks, ...mockBonusTasks, ...mockProjectTasks]
}

// Get only free tasks (not part of any project)
export function getFreeTasks() {
  return [...mockTasks, ...mockBonusTasks].filter(t => !t.project_id)
}

// Get all project tasks
export function getAllProjectTasks() {
  return mockProjectTasks
}

/**
 * Get tasks for the main Tasks list based on user context
 *
 * Rules:
 * 1. Free tasks (no project_id) - always shown
 * 2. Project tasks shown only if:
 *    - Assigned to current user AND not blocked
 *    - OR is_next_action === true (project owner sees next step)
 *
 * @param userId - Current user ID to filter assigned tasks
 * @param includeNextActions - Show next actions even if not assigned to user
 */
export function getTasksForMainList(userId: string, includeNextActions: boolean = true): Task[] {
  // Free tasks (not part of any project)
  const freeTasks = [...mockTasks, ...mockBonusTasks].filter(t => !t.project_id && !t.is_project)

  // Project tasks filtered by rules
  const eligibleProjectTasks = mockProjectTasks.filter(task => {
    // Skip completed tasks in main list
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false
    }

    // Rule: is_next_action always visible (if enabled)
    if (includeNextActions && task.is_next_action) {
      return true
    }

    // Rule: Assigned to user AND not blocked
    if (task.assigned_to === userId && !task.is_blocked) {
      return true
    }

    return false
  })

  return [...freeTasks, ...eligibleProjectTasks]
}

/**
 * Get project info for a task (for display purposes)
 */
export function getProjectForTask(task: Task): Project | undefined {
  if (!task.project_id) return undefined
  return mockProjects.find(p => p.id === task.project_id)
}

/**
 * Get effective priority for a task (inherits from project if not set)
 */
export function getEffectivePriority(task: Task): number {
  // If task has its own score_fire, use it
  if (task.score_fire !== undefined && task.score_fire > 0) {
    return task.score_fire
  }

  // Otherwise, inherit from project
  if (task.project_id) {
    const project = mockProjects.find(p => p.id === task.project_id)
    if (project?.priority !== undefined) {
      return project.priority
    }
  }

  // Default to normal (1)
  return 1
}

// ==========================================
// URGENCY & ESCALATION HELPERS
// ==========================================

/**
 * Konfigurace pro urgování
 */
export const URGENCY_CONFIG = {
  MAX_URGENCIES_BEFORE_ESCALATION: 3,  // Po 3 urgencích eskalovat
  DAYS_BETWEEN_URGENCIES: 2,            // Minimální interval mezi urgencemi
  AUTO_ESCALATE_AFTER_DAYS: 7,          // Automaticky eskalovat po 7 dnech bez reakce
}

/**
 * Získá úroveň eskalace pro úkol (0-3)
 * 0 = bez eskalace, 1 = urgováno 1-2×, 2 = urgováno 3×, 3 = eskalováno na manažera
 */
export function getEscalationLevel(task: Task): 0 | 1 | 2 | 3 {
  if (task.escalated_to) return 3
  if (!task.urgency_count) return 0
  if (task.urgency_count >= URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION) return 2
  return 1
}

/**
 * Zjistí jestli úkol potřebuje urgenci (čeká na klienta a nebyl urgován dostatečně nedávno)
 */
export function needsUrgency(task: Task): boolean {
  // Jen úkoly čekající na klienta
  if (task.status !== 'waiting_for' && task.status !== 'waiting_client') return false

  // Pokud je eskalováno, už ne
  if (task.escalated_to) return false

  // Pokud nebyl nikdy urgován, potřebuje urgenci
  if (!task.last_urged_at) return true

  // Zjisti kolik dní od poslední urgence
  try {
    const lastUrged = new Date(task.last_urged_at)
    if (isNaN(lastUrged.getTime())) return true // Invalid date = needs urgency
    const now = new Date()
    const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceLastUrge >= URGENCY_CONFIG.DAYS_BETWEEN_URGENCIES
  } catch {
    return true // On error, assume urgency needed
  }
}

/**
 * Zjistí jestli je čas na eskalaci (dosažen limit urgencí nebo dlouhá doba bez reakce)
 */
export function shouldEscalate(task: Task, maxUrgencies: number = URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION): boolean {
  // Už eskalováno
  if (task.escalated_to) return false

  // Dosažen limit urgencí
  if (task.urgency_count && task.urgency_count >= maxUrgencies) return true

  // Dlouhá doba od první urgence bez reakce
  if (task.last_urged_at) {
    const lastUrged = new Date(task.last_urged_at)
    const now = new Date()
    const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastUrge >= URGENCY_CONFIG.AUTO_ESCALATE_AFTER_DAYS) return true
  }

  return false
}

/**
 * Provede urgenci na úkolu (vrací nový task objekt)
 */
export function urgeTask(task: Task): Task {
  return {
    ...task,
    urgency_count: (task.urgency_count || 0) + 1,
    last_urged_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Eskaluje úkol na manažera (vrací nový task objekt)
 */
export function escalateTask(task: Task, managerId: string, reason: string): Task {
  return {
    ...task,
    escalated_to: managerId,
    escalated_at: new Date().toISOString(),
    escalation_reason: reason,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Získá reliability score pro firmu
 */
export function getCompanyReliabilityScore(companyId: string): 0 | 1 | 2 | 3 {
  const company = mockCompanies.find(c => c.id === companyId) as typeof mockCompanies[0] & { reliability_score?: 0 | 1 | 2 | 3 }
  return company?.reliability_score ?? 2  // Default: normální
}

/**
 * Vrátí textový popis reliability score
 */
export function getReliabilityLabel(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return 'Beznadějný'
    case 1: return 'Problémový'
    case 2: return 'Normální'
    case 3: return 'Spolehlivý'
  }
}

/**
 * Vrátí emoji pro reliability score
 */
export function getReliabilityEmoji(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return '🔴'  // Beznadějný
    case 1: return '🟠'  // Problémový
    case 2: return '🟡'  // Normální
    case 3: return '🟢'  // Spolehlivý
  }
}

/**
 * Vrátí úkoly eskalované na daného manažera
 */
export function getEscalatedTasksForManager(managerId: string): Task[] {
  return [...mockTasks, ...mockProjectTasks].filter(t => t.escalated_to === managerId)
}

/**
 * Vrátí úkoly které potřebují urgenci pro daného uživatele
 */
export function getTasksNeedingUrgency(userId: string): Task[] {
  return [...mockTasks, ...mockProjectTasks].filter(t =>
    t.assigned_to === userId && needsUrgency(t)
  )
}

// ==========================================
// MAJETEK FIRMY
// ==========================================

export const mockAssets: Asset[] = []

export function getAssetsByCompany(companyId: string): Asset[] {
  return mockAssets.filter(a => a.company_id === companyId)
}

export function getActiveAssetsByCompany(companyId: string): Asset[] {
  return mockAssets.filter(a => a.company_id === companyId && a.status === 'active')
}

// ==========================================
// POJIŠTĚNÍ A SMLOUVY
// ==========================================

export const mockInsurances: Insurance[] = []

export function getInsurancesByCompany(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId)
}

export function getActiveInsurancesByCompany(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId && i.status === 'active')
}

export function getTaxDeductibleInsurances(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId && i.is_tax_deductible && i.status === 'active')
}

// ============================================
// GAMIFICATION: TIME LOGS
// ============================================
export const mockTimeLogs: TimeLog[] = []

// ============================================
// GAMIFICATION: USER TASK SETTINGS
// ============================================
export const mockUserTaskSettings: UserTaskSettings[] = []

// ============================================
// GAMIFICATION: TASK SYSTEM SETTINGS
// ============================================
export const mockTaskSystemSettings: TaskSystemSettings = {
  monthly_cutoff_day: 5,
  approval_deadline_hours: 24,
  min_quality_for_bonus: 80,
  points_to_currency_rate: 1,
}

// ============================================
// PROJECTS (kontejnery pro fáze a úkoly)
// ============================================
export const mockProjects: Project[] = []

// ============================================
// PHASES (fáze v projektech)
// ============================================
export const mockPhases: Phase[] = []

// ============================================
// PROJECT TASKS (úkoly patřící do projektů)
// ============================================
export const mockProjectTasks: Task[] = []

// Helper functions for projects
export function getAllProjects(): Project[] {
  return mockProjects
}

export function getProjectById(projectId: string): Project | undefined {
  return mockProjects.find(p => p.id === projectId)
}

export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return mockProjects.filter(p => p.status === status)
}

export function getProjectsByCompany(companyId: string): Project[] {
  return mockProjects.filter(p => p.company_id === companyId)
}

export function getProjectsByOwner(ownerId: string): Project[] {
  return mockProjects.filter(p => p.owner_id === ownerId)
}

export function getPhasesForProject(projectId: string): Phase[] {
  return mockPhases.filter(p => p.project_id === projectId).sort((a, b) => a.position - b.position)
}

export function getTasksForProject(projectId: string): Task[] {
  return mockProjectTasks.filter(t => t.project_id === projectId)
}

export function getTasksForPhase(phaseId: string): Task[] {
  return mockProjectTasks.filter(t => t.phase_id === phaseId).sort((a, b) => (a.position_in_phase || 0) - (b.position_in_phase || 0))
}

export function getNextActionForProject(projectId: string): Task | undefined {
  return mockProjectTasks.find(t => t.project_id === projectId && t.is_next_action)
}

export function getActiveProjects(): Project[] {
  return mockProjects.filter(p => p.status === 'active')
}

// ============================================
// GAMIFICATION: BONUS TASKS (pool)
// ============================================
export const mockBonusTasks: Task[] = []

// ============================================
// GAMIFICATION: TASK APPROVALS HISTORY
// ============================================
export const mockTaskApprovals: TaskApproval[] = []

// ============================================
// CLIENT REQUESTS DATA
// ============================================
export const mockClientRequests: ClientRequest[] = []

// ============================================
// GAMIFICATION: HELPER FUNCTIONS
// ============================================

// Get task type with default
export function getTaskType(task: Task): TaskType {
  return task.task_type || 'base'
}

// Get rejection count with default
export function getTaskRejectionCount(task: Task): number {
  return task.rejection_count || 0
}

// Check if estimate is locked (default: true for existing tasks)
export function isEstimateLocked(task: Task): boolean {
  return task.estimate_locked !== false
}

// Get time logs for task
export function getTimeLogsForTask(taskId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.task_id === taskId)
}

// Get total logged time for task
export function getTotalLoggedMinutes(taskId: string): number {
  return getTimeLogsForTask(taskId).reduce((sum, tl) => sum + tl.minutes, 0)
}

// Get time logs for user
export function getTimeLogsForUser(userId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.user_id === userId)
}

// Get time logs for client
export function getTimeLogsForClient(clientId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.client_id === clientId ||
    // Also include task-based logs if task is for this client
    (tl.task_id && mockTasks.find(t => t.id === tl.task_id)?.company_id === clientId)
  )
}

// Get non-task time logs (general time tracking)
export function getNonTaskTimeLogs(): TimeLog[] {
  return mockTimeLogs.filter(tl => !tl.task_id)
}

// Get time logs for user for specific date range
export function getTimeLogsForUserInRange(userId: string, startDate: string, endDate: string): TimeLog[] {
  return mockTimeLogs.filter(tl =>
    tl.user_id === userId &&
    tl.date &&
    tl.date >= startDate &&
    tl.date <= endDate
  )
}

// Get aggregated time stats for user
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
    task: 0,
    general: 0,
    admin: 0,
    meeting: 0,
    call: 0,
    email: 0,
  }

  let totalMinutes = 0
  let billableMinutes = 0
  let nonBillableMinutes = 0
  let taskMinutes = 0
  let nonTaskMinutes = 0

  logs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) {
      billableMinutes += log.minutes
    } else {
      nonBillableMinutes += log.minutes
    }
    if (log.task_id) {
      taskMinutes += log.minutes
    } else {
      nonTaskMinutes += log.minutes
    }
    byActivityType[log.activity_type] += log.minutes
  })

  return {
    totalMinutes,
    billableMinutes,
    nonBillableMinutes,
    taskMinutes,
    nonTaskMinutes,
    byActivityType,
  }
}

// Get aggregated time stats for client
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
    task: 0,
    general: 0,
    admin: 0,
    meeting: 0,
    call: 0,
    email: 0,
  }

  const userMap = new Map<string, { userName: string; minutes: number }>()
  let totalMinutes = 0
  let billableMinutes = 0

  clientLogs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) {
      billableMinutes += log.minutes
    }
    byActivityType[log.activity_type] += log.minutes

    const existing = userMap.get(log.user_id)
    if (existing) {
      existing.minutes += log.minutes
    } else {
      userMap.set(log.user_id, { userName: log.user_name, minutes: log.minutes })
    }
  })

  return {
    totalMinutes,
    billableMinutes,
    byUser: Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      minutes: data.minutes,
    })),
    byActivityType,
  }
}

// Add a new time log
export function addTimeLog(log: Omit<TimeLog, 'id' | 'created_at'>): TimeLog {
  const newLog: TimeLog = {
    ...log,
    id: `tl-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  mockTimeLogs.push(newLog)
  return newLog
}

// Get user task settings
export function getUserTaskSettings(userId: string): UserTaskSettings | undefined {
  return mockUserTaskSettings.find(s => s.user_id === userId)
}

// Check if user can claim bonus tasks
export function canUserClaimBonus(userId: string): boolean {
  const settings = getUserTaskSettings(userId)
  if (!settings) return false
  return settings.can_claim_bonus && settings.quality_score >= mockTaskSystemSettings.min_quality_for_bonus
}

// Get available bonus tasks (not claimed)
export function getAvailableBonusTasks(): Task[] {
  return mockBonusTasks.filter(t => !t.claimed_by && t.status === 'pending')
}

// Get user's current WIP count
export function getUserWipCount(userId: string): { total: number; bonus: number } {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  const inProgressStatuses: TaskStatus[] = ['accepted', 'in_progress', 'awaiting_approval']

  const userTasks = allTasks.filter(t =>
    t.assigned_to === userId &&
    inProgressStatuses.includes(t.status)
  )

  return {
    total: userTasks.length,
    bonus: userTasks.filter(t => getTaskType(t) === 'bonus').length,
  }
}

// Check if user can take more tasks
export function canUserTakeMoreTasks(userId: string): { canTake: boolean; canTakeBonus: boolean; reason?: string } {
  const settings = getUserTaskSettings(userId)
  if (!settings) return { canTake: false, canTakeBonus: false, reason: 'Uživatel nemá nastavení' }

  const wip = getUserWipCount(userId)

  const canTake = wip.total < settings.max_wip_total
  const canTakeBonus = settings.can_claim_bonus &&
                       wip.bonus < settings.max_wip_bonus &&
                       settings.quality_score >= mockTaskSystemSettings.min_quality_for_bonus

  let reason: string | undefined
  if (!canTake) {
    reason = `Dosažen limit ${settings.max_wip_total} rozpracovaných úkolů`
  } else if (!canTakeBonus && settings.can_claim_bonus) {
    if (settings.quality_score < mockTaskSystemSettings.min_quality_for_bonus) {
      reason = 'Kvalita pod minimem pro bonus úkoly'
    } else if (wip.bonus >= settings.max_wip_bonus) {
      reason = `Dosažen limit ${settings.max_wip_bonus} bonus úkolů`
    }
  }

  return { canTake, canTakeBonus, reason }
}

// FÁZE 6: Check monthly cutoff and base completion status
export function getMonthlyStatus(userId: string): {
  cutoffDay: number
  isBaseComplete: boolean
  canCashOut: boolean
  daysUntilCutoff: number
  baseRequired: number
  baseCompleted: number
  bonusPoints: number
} {
  const settings = getUserTaskSettings(userId)
  const today = new Date()
  const cutoffDay = mockTaskSystemSettings.monthly_cutoff_day

  // Calculate days until next cutoff
  let nextCutoff = new Date(today.getFullYear(), today.getMonth(), cutoffDay)
  if (today.getDate() >= cutoffDay) {
    nextCutoff = new Date(today.getFullYear(), today.getMonth() + 1, cutoffDay)
  }
  const daysUntilCutoff = Math.ceil((nextCutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Check base completion
  const baseRequired = settings?.monthly_base_required || 0
  const baseCompleted = settings?.monthly_base_completed || 0
  const isBaseComplete = baseCompleted >= baseRequired
  const bonusPoints = settings?.monthly_bonus_points || 0

  return {
    cutoffDay,
    isBaseComplete,
    canCashOut: isBaseComplete && bonusPoints > 0 && !settings?.monthly_bonus_cashed_out,
    daysUntilCutoff,
    baseRequired,
    baseCompleted,
    bonusPoints,
  }
}

// Calculate inbox + overdue for menu badge
export function getAttentionRequiredCount(): number {
  const archivedStatuses: TaskStatus[] = ['completed', 'invoiced', 'cancelled']
  const waitingStatuses: TaskStatus[] = ['waiting_for', 'waiting_client']
  const inboxStatuses: TaskStatus[] = ['pending', 'clarifying']

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allTasks = [...mockTasks, ...mockBonusTasks]

  // Inbox tasks
  const inboxTasks = allTasks.filter(t =>
    inboxStatuses.includes(t.status) &&
    !archivedStatuses.includes(t.status)
  )

  // Overdue tasks (not waiting, not archived)
  const overdueTasks = allTasks.filter(t => {
    if (archivedStatuses.includes(t.status)) return false
    if (waitingStatuses.includes(t.status)) return false
    if (inboxStatuses.includes(t.status)) return false // Already counted in inbox

    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  })

  return inboxTasks.length + overdueTasks.length
}

// Get tasks awaiting approval (for manager view)
export function getTasksAwaitingApproval(): Task[] {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  return allTasks.filter(t => t.status === 'awaiting_approval')
}

// FÁZE 7: Aggregate billable time logs by client for invoicing
export interface BillableSummary {
  company_id: string
  company_name: string
  totalMinutes: number
  totalAmount: number
  uninvoicedTasks: {
    task_id: string
    task_title: string
    minutes: number
    amount: number
    logs: TimeLog[]
  }[]
}

export function getBillableByClient(): BillableSummary[] {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  const billableByCompany: Map<string, BillableSummary> = new Map()

  // Find tasks that are billable and completed (but not invoiced)
  const billableTasks = allTasks.filter(t =>
    t.is_billable &&
    t.status === 'completed' // Completed but not yet invoiced
  )

  for (const task of billableTasks) {
    const logs = getTimeLogsForTask(task.id)
    const taskMinutes = logs.reduce((sum, log) => sum + log.minutes, 0) || task.actual_minutes || 0
    const hourlyRate = task.hourly_rate || 0
    const taskAmount = Math.round((taskMinutes / 60) * hourlyRate)

    if (!billableByCompany.has(task.company_id)) {
      billableByCompany.set(task.company_id, {
        company_id: task.company_id,
        company_name: task.company_name,
        totalMinutes: 0,
        totalAmount: 0,
        uninvoicedTasks: [],
      })
    }

    const summary = billableByCompany.get(task.company_id)!
    summary.totalMinutes += taskMinutes
    summary.totalAmount += taskAmount
    summary.uninvoicedTasks.push({
      task_id: task.id,
      task_title: task.title,
      minutes: taskMinutes,
      amount: taskAmount,
      logs,
    })
  }

  return Array.from(billableByCompany.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

// ============================================
// CLIENT REQUESTS HELPER FUNCTIONS
// ============================================

// Get all client requests
export function getClientRequests(): ClientRequest[] {
  return mockClientRequests
}

// Get client requests for a specific client
export function getClientRequestsByClient(clientId: string): ClientRequest[] {
  return mockClientRequests.filter(r => r.client_id === clientId)
}

// Get client requests assigned to a user
export function getClientRequestsByAssignee(userId: string): ClientRequest[] {
  return mockClientRequests.filter(r => r.assigned_to === userId)
}

// Get new/unassigned requests (for manager view)
export function getUnassignedClientRequests(): ClientRequest[] {
  return mockClientRequests.filter(r => !r.assigned_to && r.status === 'new')
}

// Get active requests (not completed/rejected)
export function getActiveClientRequests(): ClientRequest[] {
  return mockClientRequests.filter(r => !['completed', 'rejected'].includes(r.status))
}

// Get request stats for dashboard
export function getClientRequestStats(): {
  total: number
  new: number
  inProgress: number
  urgent: number
  completed: number
} {
  const requests = mockClientRequests
  return {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    inProgress: requests.filter(r => r.status === 'in_progress' || r.status === 'reviewed').length,
    urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }
}

// Get category label
export function getRequestCategoryLabel(category: ClientRequestCategory): string {
  const labels: Record<ClientRequestCategory, string> = {
    accounting: 'Účetnictví',
    tax: 'Daně',
    payroll: 'Mzdy',
    consulting: 'Poradenství',
    documents: 'Dokumenty',
    other: 'Ostatní',
  }
  return labels[category]
}

// Get priority label
export function getRequestPriorityLabel(priority: ClientRequestPriority): string {
  const labels: Record<ClientRequestPriority, string> = {
    low: 'Nízká',
    normal: 'Normální',
    high: 'Vysoká',
    urgent: 'Urgentní',
  }
  return labels[priority]
}

// Get status label
export function getRequestStatusLabel(status: ClientRequestStatus): string {
  const labels: Record<ClientRequestStatus, string> = {
    new: 'Nový',
    reviewed: 'Posouzeno',
    in_progress: 'Řeší se',
    completed: 'Vyřešeno',
    rejected: 'Zamítnuto',
  }
  return labels[status]
}

// Add new client request
export function addClientRequest(request: Omit<ClientRequest, 'id' | 'created_at' | 'updated_at'>): ClientRequest {
  const newRequest: ClientRequest = {
    ...request,
    id: `req-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockClientRequests.push(newRequest)
  return newRequest
}

// Update client request
export function updateClientRequest(id: string, updates: Partial<ClientRequest>): ClientRequest | null {
  const index = mockClientRequests.findIndex(r => r.id === id)
  if (index === -1) return null

  mockClientRequests[index] = {
    ...mockClientRequests[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return mockClientRequests[index]
}

