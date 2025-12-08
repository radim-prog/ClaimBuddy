// ============================================
// TIMELINE HELPERS - Task Management Integration
// ============================================
// Created: 2025-12-07
// Purpose: Helper functions for creating and managing task timeline events
// ============================================

import { TaskTimelineEvent, Task, TimeTrackingEntry, TaskInvoice } from '@/lib/types/tasks'

// ============================================
// EVENT CREATION HELPERS
// ============================================

/**
 * Create a timeline event when a task is created
 */
export function createTaskCreatedEvent(
  task: Task,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_created',
    event_data: {
      task_title: task.title,
      task_description: task.description,
      priority: task.priority,
      is_project: task.is_project,
      assigned_to_name: task.assigned_to_name,
      due_date: task.due_date,
      estimated_minutes: task.estimated_minutes,
      is_billable: task.is_billable,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: task.is_project
      ? `${userName} vytvořil projekt: ${task.title}`
      : `${userName} vytvořil úkol: ${task.title}`,
    display_icon: task.is_project ? 'FolderPlus' : 'Plus',
    display_color: task.is_project ? 'purple' : 'blue',
  }
}

/**
 * Create a timeline event when a task is assigned
 */
export function createTaskAssignedEvent(
  task: Task,
  userId: string,
  userName: string,
  assignedToName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_assigned',
    event_data: {
      task_title: task.title,
      assigned_to_name: assignedToName,
      priority: task.priority,
      due_date: task.due_date,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} přiřadil úkol "${task.title}" → ${assignedToName}`,
    display_icon: 'UserPlus',
    display_color: 'blue',
  }
}

/**
 * Create a timeline event when a task is accepted
 */
export function createTaskAcceptedEvent(
  task: Task,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_accepted',
    event_data: {
      task_title: task.title,
      accepted_by_name: userName,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} přijal úkol: ${task.title}`,
    display_icon: 'CheckCircle',
    display_color: 'green',
  }
}

/**
 * Create a timeline event when a task is rejected
 */
export function createTaskRejectedEvent(
  task: Task,
  userId: string,
  userName: string,
  reason?: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_delegated', // We'll use delegated type for rejected too
    event_data: {
      task_title: task.title,
      rejected_by_name: userName,
      rejection_reason: reason,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} odmítl úkol: ${task.title}`,
    display_icon: 'XCircle',
    display_color: 'red',
  }
}

/**
 * Create a timeline event when work starts on a task
 */
export function createTaskStartedEvent(
  task: Task,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_started',
    event_data: {
      task_title: task.title,
      started_by_name: userName,
      estimated_minutes: task.estimated_minutes,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} začal pracovat na: ${task.title}`,
    display_icon: 'Play',
    display_color: 'blue',
  }
}

/**
 * Create a timeline event when a task is completed
 */
export function createTaskCompletedEvent(
  task: Task,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  const hours = task.actual_minutes / 60
  const billableAmount = task.is_billable && task.hourly_rate
    ? hours * task.hourly_rate
    : 0

  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_completed',
    event_data: {
      task_title: task.title,
      completed_by_name: userName,
      actual_minutes: task.actual_minutes,
      estimated_minutes: task.estimated_minutes,
      billable_amount: billableAmount,
      is_billable: task.is_billable,
      time_difference: task.estimated_minutes
        ? task.actual_minutes - task.estimated_minutes
        : null,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: task.is_billable
      ? `${userName} dokončil úkol: ${task.title} (${Math.round(hours * 10) / 10}h, ${Math.round(billableAmount).toLocaleString()} Kč)`
      : `${userName} dokončil úkol: ${task.title} (${Math.round(hours * 10) / 10}h)`,
    display_icon: 'CheckSquare',
    display_color: 'green',
  }
}

/**
 * Create a timeline event when a task is delegated
 */
export function createTaskDelegatedEvent(
  task: Task,
  userId: string,
  userName: string,
  delegatedToName: string,
  reason?: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_delegated',
    event_data: {
      task_title: task.title,
      delegated_from_name: userName,
      delegated_to_name: delegatedToName,
      delegation_reason: reason,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} delegoval úkol "${task.title}" → ${delegatedToName}`,
    display_icon: 'ArrowRight',
    display_color: 'orange',
  }
}

/**
 * Create a timeline event when time is logged on a task
 */
export function createTimeLoggedEvent(
  task: Task,
  timeEntry: TimeTrackingEntry,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  const hours = (timeEntry.duration_minutes || 0) / 60
  const billableAmount = timeEntry.billable && task.hourly_rate
    ? hours * task.hourly_rate
    : 0

  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'time_logged',
    event_data: {
      task_title: task.title,
      logged_by_name: userName,
      duration_minutes: timeEntry.duration_minutes,
      note: timeEntry.note,
      billable: timeEntry.billable,
      billable_amount: billableAmount,
      started_at: timeEntry.started_at,
      stopped_at: timeEntry.stopped_at,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: timeEntry.billable && billableAmount > 0
      ? `${userName} zalogoval ${Math.round(hours * 10) / 10}h k úkolu: ${task.title} (${Math.round(billableAmount).toLocaleString()} Kč)`
      : `${userName} zalogoval ${Math.round(hours * 10) / 10}h k úkolu: ${task.title}`,
    display_icon: 'Clock',
    display_color: 'blue',
  }
}

/**
 * Create a timeline event when a project milestone is reached
 */
export function createProjectMilestoneEvent(
  task: Task,
  userId: string,
  userName: string,
  milestoneName: string,
  progressPercentage?: number
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    project_id: task.id,
    event_type: 'project_milestone',
    event_data: {
      project_title: task.title,
      milestone_name: milestoneName,
      progress_percentage: progressPercentage || task.progress_percentage,
      actual_hours: task.actual_minutes / 60,
      estimated_hours: task.estimated_minutes ? task.estimated_minutes / 60 : undefined,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: progressPercentage !== undefined
      ? `${userName} dokončil milestone "${milestoneName}" (${progressPercentage}%)`
      : `${userName} dokončil milestone "${milestoneName}"`,
    display_icon: 'Trophy',
    display_color: 'purple',
  }
}

/**
 * Create a timeline event when an invoice is generated for a task/project
 */
export function createInvoiceGeneratedEvent(
  task: Task,
  invoice: TaskInvoice,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'invoice_generated',
    event_data: {
      task_title: task.title,
      invoice_period: invoice.invoice_period,
      total_hours: invoice.total_hours,
      hourly_rate: invoice.hourly_rate,
      total_amount: invoice.total_amount,
      invoice_id: invoice.id,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} vygeneroval fakturu: ${task.title} - ${invoice.invoice_period} (${Math.round(invoice.total_hours * 10) / 10}h, ${invoice.total_amount.toLocaleString()} Kč)`,
    display_icon: 'DollarSign',
    display_color: 'green',
  }
}

/**
 * Create a timeline event when checklist item is completed
 */
export function createChecklistItemCompletedEvent(
  task: Task,
  checklistItemText: string,
  userId: string,
  userName: string
): Omit<TaskTimelineEvent, 'id' | 'created_at'> {
  return {
    company_id: task.company_id,
    task_id: task.id,
    event_type: 'task_completed', // Using task_completed for checklist items
    event_data: {
      task_title: task.title,
      checklist_item: checklistItemText,
      completed_by_name: userName,
    },
    created_by: userId,
    created_by_name: userName,
    display_title: `${userName} dokončil krok: ${checklistItemText} (${task.title})`,
    display_icon: 'CheckCircle',
    display_color: 'green',
  }
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get timeline events for a specific task
 * In production, this would query the database
 */
export async function getTaskTimeline(taskId: string): Promise<TaskTimelineEvent[]> {
  // TODO: Implement database query
  // For now, return empty array - this will be populated from mock data
  return []
}

/**
 * Get timeline events for a company with optional filters
 * In production, this would query the database with filters
 */
export async function getCompanyTimeline(
  companyId: string,
  filters?: {
    eventTypes?: string[]
    taskId?: string
    projectId?: string
    startDate?: string
    endDate?: string
  }
): Promise<TaskTimelineEvent[]> {
  // TODO: Implement database query with filters
  // For now, return empty array - this will be populated from mock data
  return []
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} hod`
  return `${hours} hod ${mins} min`
}

/**
 * Calculate time difference percentage
 */
export function calculateTimeDifference(
  estimatedMinutes: number | undefined,
  actualMinutes: number
): { difference: number; percentage: number; label: string } | null {
  if (!estimatedMinutes || estimatedMinutes === 0) return null

  const difference = actualMinutes - estimatedMinutes
  const percentage = Math.round((difference / estimatedMinutes) * 100)

  let label = ''
  if (difference > 0) {
    label = `+${percentage}% déle než odhad`
  } else if (difference < 0) {
    label = `${percentage}% rychleji než odhad`
  } else {
    label = 'Přesně dle odhadu'
  }

  return { difference, percentage, label }
}

/**
 * Get icon component name for event type
 */
export function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    task_created: 'Plus',
    task_assigned: 'UserPlus',
    task_accepted: 'CheckCircle',
    task_started: 'Play',
    task_completed: 'CheckSquare',
    task_delegated: 'ArrowRight',
    project_created: 'FolderPlus',
    project_milestone: 'Trophy',
    time_logged: 'Clock',
    invoice_generated: 'DollarSign',
  }

  return iconMap[eventType] || 'Circle'
}

/**
 * Get color for event type
 */
export function getEventColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    task_created: 'blue',
    task_assigned: 'blue',
    task_accepted: 'green',
    task_started: 'blue',
    task_completed: 'green',
    task_delegated: 'orange',
    project_created: 'purple',
    project_milestone: 'purple',
    time_logged: 'blue',
    invoice_generated: 'green',
  }

  return colorMap[eventType] || 'gray'
}

/**
 * Get display label for event type
 */
export function getEventLabel(eventType: string): string {
  const labelMap: Record<string, string> = {
    task_created: 'Úkol vytvořen',
    task_assigned: 'Úkol přiřazen',
    task_accepted: 'Úkol přijat',
    task_started: 'Práce začala',
    task_completed: 'Úkol dokončen',
    task_delegated: 'Úkol delegován',
    project_created: 'Projekt vytvořen',
    project_milestone: 'Milestone',
    time_logged: 'Čas zalogován',
    invoice_generated: 'Faktura',
  }

  return labelMap[eventType] || eventType
}

// ============================================
// EXPORT ALL HELPERS
// ============================================

export const TimelineHelpers = {
  // Event creation
  createTaskCreatedEvent,
  createTaskAssignedEvent,
  createTaskAcceptedEvent,
  createTaskRejectedEvent,
  createTaskStartedEvent,
  createTaskCompletedEvent,
  createTaskDelegatedEvent,
  createTimeLoggedEvent,
  createProjectMilestoneEvent,
  createInvoiceGeneratedEvent,
  createChecklistItemCompletedEvent,

  // Query helpers
  getTaskTimeline,
  getCompanyTimeline,

  // Formatting helpers
  formatDuration,
  calculateTimeDifference,
  getEventIcon,
  getEventColor,
  getEventLabel,
}
