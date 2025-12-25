/**
 * Task API Helper Functions
 *
 * Utility functions for task API endpoints including:
 * - Authentication and authorization
 * - Validation
 * - Error handling
 * - Common operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Task, TaskStatus, TaskPriority } from '@/lib/types/tasks'

// ============================================
// AUTHENTICATION & AUTHORIZATION
// ============================================

/**
 * Check if user is authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthenticated')
  }
  return user
}

/**
 * Check if user has admin or accountant role
 */
export async function isAdminOrAccountant(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin' || user?.role === 'accountant'
}

/**
 * Require admin or accountant role - throws if not authorized
 * Use this for protecting API routes that require admin/accountant access
 * @throws Error if not authenticated or not admin/accountant
 */
export async function requireAdminOrAccountant(supabase: SupabaseClient) {
  const user = await requireAuth(supabase)
  const hasAccess = await isAdminOrAccountant(supabase, user.id)
  if (!hasAccess) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user has admin role only
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin'
}

/**
 * Require admin role only - throws if not authorized
 * Use this for protecting API routes that require admin-only access
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(supabase: SupabaseClient) {
  const user = await requireAuth(supabase)
  const hasAccess = await isAdmin(supabase, user.id)
  if (!hasAccess) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user has permission to access task
 */
export async function canAccessTask(
  supabase: SupabaseClient,
  userId: string,
  task: Task
): Promise<boolean> {
  // Check if user is admin/accountant
  if (await isAdminOrAccountant(supabase, userId)) {
    return true
  }

  // Check if user is creator, assignee, or delegatee
  if (
    task.created_by === userId ||
    task.assigned_to === userId ||
    task.delegated_to === userId
  ) {
    return true
  }

  // Check if user has access via company
  const { data: company } = await supabase
    .from('companies')
    .select('owner_id, assigned_accountant_id')
    .eq('id', task.company_id)
    .single()

  if (company?.owner_id === userId || company?.assigned_accountant_id === userId) {
    return true
  }

  return false
}

/**
 * Check if user can modify task
 */
export async function canModifyTask(
  supabase: SupabaseClient,
  userId: string,
  task: Task
): Promise<boolean> {
  // Admins and accountants can always modify
  if (await isAdminOrAccountant(supabase, userId)) {
    return true
  }

  // Task creator, assignee, or delegatee can modify
  return (
    task.created_by === userId ||
    task.assigned_to === userId ||
    task.delegated_to === userId
  )
}

/**
 * Check if user can delete task
 */
export async function canDeleteTask(
  supabase: SupabaseClient,
  userId: string,
  task: Task
): Promise<boolean> {
  // Only admins, accountants, or task creator can delete
  if (await isAdminOrAccountant(supabase, userId)) {
    return true
  }

  return task.created_by === userId
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate task status
 */
export function isValidStatus(status: string): status is TaskStatus {
  const validStatuses: TaskStatus[] = [
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
  ]
  return validStatuses.includes(status as TaskStatus)
}

/**
 * Validate task priority
 */
export function isValidPriority(priority: string): priority is TaskPriority {
  const validPriorities: TaskPriority[] = ['critical', 'high', 'medium', 'low']
  return validPriorities.includes(priority as TaskPriority)
}

/**
 * Validate required fields for task creation
 */
export function validateTaskCreation(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title je povinné pole')
  }

  if (!data.company_id) {
    errors.push('company_id je povinné pole')
  }

  if (!data.company_name) {
    errors.push('company_name je povinné pole')
  }

  if (data.status && !isValidStatus(data.status)) {
    errors.push('Neplatný status úkolu')
  }

  if (data.priority && !isValidPriority(data.priority)) {
    errors.push('Neplatná priorita úkolu')
  }

  if (data.is_billable && !data.hourly_rate) {
    errors.push('hourly_rate je povinné pro fakturovatelné úkoly')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate time tracking entry
 */
export function validateTimeTrackingEntry(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.started_at) {
    errors.push('started_at je povinné pole')
  }

  if (data.stopped_at && new Date(data.stopped_at) < new Date(data.started_at)) {
    errors.push('stopped_at musí být po started_at')
  }

  if (data.duration_minutes !== undefined && data.duration_minutes < 0) {
    errors.push('duration_minutes nemůže být záporné')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
  message: string
  code?: string
  status: number
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: any,
  defaultMessage = 'Interní chyba serveru'
): ApiError {
  // Handle Supabase errors
  if (error.code === 'PGRST116') {
    return {
      message: 'Záznam nenalezen',
      code: error.code,
      status: 404,
    }
  }

  if (error.code === '23505') {
    return {
      message: 'Záznam s těmito hodnotami již existuje',
      code: error.code,
      status: 409,
    }
  }

  if (error.code === '23503') {
    return {
      message: 'Souvisící záznam neexistuje',
      code: error.code,
      status: 400,
    }
  }

  // Handle custom errors
  if (error.message === 'Unauthenticated') {
    return {
      message: 'Nepřihlášen',
      status: 401,
    }
  }

  if (error.message === 'Unauthorized') {
    return {
      message: 'Nemáte oprávnění',
      status: 403,
    }
  }

  // Default error
  return {
    message: error.message || defaultMessage,
    code: error.code,
    status: error.status || 500,
  }
}

/**
 * Safe async error wrapper
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    const apiError = createErrorResponse(error, errorMessage)
    throw new Error(apiError.message)
  }
}

// ============================================
// COMMON OPERATIONS
// ============================================

/**
 * Get task by ID with error handling
 */
export async function getTaskById(
  supabase: SupabaseClient,
  taskId: string
): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    throw error
  }

  if (!task) {
    throw new Error('Task not found')
  }

  return task as Task
}

/**
 * Check if user exists
 */
export async function userExists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  return !!data
}

/**
 * Check if company exists and user has access
 */
export async function canAccessCompany(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<boolean> {
  // Check if user is admin/accountant
  if (await isAdminOrAccountant(supabase, userId)) {
    return true
  }

  const { data: company } = await supabase
    .from('companies')
    .select('owner_id, assigned_accountant_id')
    .eq('id', companyId)
    .single()

  if (!company) {
    return false
  }

  return company.owner_id === userId || company.assigned_accountant_id === userId
}

/**
 * Get current invoice period (YYYY-MM format)
 */
export function getCurrentInvoicePeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Calculate billable amount
 */
export function calculateBillableAmount(
  billableHours: number,
  hourlyRate: number
): number {
  return Math.round(billableHours * hourlyRate * 100) / 100
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

/**
 * Check if task can be completed
 */
export async function canCompleteTask(
  supabase: SupabaseClient,
  task: Task
): Promise<{ can: boolean; reason?: string }> {
  // Check if already completed
  if (task.status === 'completed') {
    return { can: false, reason: 'Úkol již byl dokončen' }
  }

  // If project, check if all subtasks are completed
  if (task.is_project) {
    const { data: subtasks } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('parent_project_id', task.id)

    const hasIncompleteSubtasks = subtasks?.some(
      subtask => subtask.status !== 'completed' && subtask.status !== 'cancelled'
    )

    if (hasIncompleteSubtasks) {
      const incompleteCount = subtasks?.filter(
        s => s.status !== 'completed' && s.status !== 'cancelled'
      ).length || 0

      return {
        can: false,
        reason: `Nejprve dokončete všechny dílčí úkoly (zbývá ${incompleteCount})`,
      }
    }
  }

  return { can: true }
}

/**
 * Stop running time tracking for task
 */
export async function stopRunningTimeTracking(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const now = new Date().toISOString()

  // Find running time entry
  const { data: runningEntry } = await supabase
    .from('time_tracking_entries')
    .select('*')
    .eq('task_id', taskId)
    .is('stopped_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (runningEntry) {
    // Stop the entry
    await supabase
      .from('time_tracking_entries')
      .update({ stopped_at: now })
      .eq('id', runningEntry.id)
  }

  // Clear time_tracking_started_at on task
  await supabase
    .from('tasks')
    .update({ time_tracking_started_at: null })
    .eq('id', taskId)
}
