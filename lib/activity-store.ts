// In-memory store pro aktivity a upomínky
// Naplňuje se POUZE reálnými akcemi uživatele (žádná fake data)
// Při refresh stránky se data resetují (TODO: uložit do Supabase)

export type ActivityType =
  | 'reminder_sent'
  | 'closure_status_changed'
  | 'deadline_completed'
  | 'task_generated'
  | 'vat_status_changed'

export type Activity = {
  id: string
  type: ActivityType
  company_id: string
  company_name: string
  title: string
  description: string
  created_at: string
  created_by: string
}

export type Reminder = {
  id: string
  company_id: string
  company_name: string
  period: string
  type: 'missing_docs' | 'deadline' | 'other'
  channel: 'email' | 'phone' | 'sms'
  sent_at: string
  sent_by: string
  notes?: string
}

// globalThis singleton - ensures all API routes share the same store
const _storeKey = '__ucetni_activity_store'
function _getStore(): { activities: Activity[]; reminders: Reminder[]; activityCounter: number; reminderCounter: number } {
  if (!(globalThis as any)[_storeKey]) {
    (globalThis as any)[_storeKey] = { activities: [], reminders: [], activityCounter: 0, reminderCounter: 0 }
  }
  return (globalThis as any)[_storeKey]
}
const activities = _getStore().activities
const reminders = _getStore().reminders

// === ACTIVITIES ===

export function addActivity(data: Omit<Activity, 'id' | 'created_at'>): Activity {
  const activity: Activity = {
    ...data,
    id: `activity-${++_getStore().activityCounter}`,
    created_at: new Date().toISOString(),
  }
  activities.unshift(activity) // newest first
  return activity
}

export function getActivities(limit: number = 20): Activity[] {
  return activities.slice(0, limit)
}

export function getActivitiesByCompany(companyId: string, limit: number = 10): Activity[] {
  return activities.filter(a => a.company_id === companyId).slice(0, limit)
}

// === REMINDERS ===

export function addReminder(data: Omit<Reminder, 'id' | 'sent_at'>): Reminder {
  const reminder: Reminder = {
    ...data,
    id: `reminder-${++_getStore().reminderCounter}`,
    sent_at: new Date().toISOString(),
  }
  reminders.unshift(reminder) // newest first

  // Also add as activity
  addActivity({
    type: 'reminder_sent',
    company_id: data.company_id,
    company_name: data.company_name,
    title: `Upomínka odeslána`,
    description: `${data.channel === 'email' ? 'Email' : data.channel === 'phone' ? 'Telefon' : 'SMS'} za období ${data.period}`,
    created_by: data.sent_by,
  })

  return reminder
}

export function getReminders(limit: number = 20): Reminder[] {
  return reminders.slice(0, limit)
}

export function getRemindersByCompany(companyId: string): Reminder[] {
  return reminders.filter(r => r.company_id === companyId)
}

export function getReminderCountByCompanyAndPeriod(companyId: string, period: string): number {
  return reminders.filter(r => r.company_id === companyId && r.period === period).length
}

// === ACTIVITY TYPE HELPERS ===

export function getActivityTypeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    reminder_sent: 'Upomínka',
    closure_status_changed: 'Stav uzávěrky',
    deadline_completed: 'Termín splněn',
    task_generated: 'Úkoly vygenerovány',
    vat_status_changed: 'Stav DPH',
  }
  return labels[type]
}

export function getActivityTypeColor(type: ActivityType): { bg: string; text: string } {
  const colors: Record<ActivityType, { bg: string; text: string }> = {
    reminder_sent: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
    closure_status_changed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    deadline_completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    task_generated: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
    vat_status_changed: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  }
  return colors[type]
}
