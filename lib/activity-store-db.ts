import { supabaseAdmin } from '@/lib/supabase-admin'

// Supabase-backed activity & reminder store
// Replaces lib/activity-store.ts (in-memory globalThis singleton)

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

// === ACTIVITIES ===

export async function addActivity(data: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
  const { data: row, error } = await supabaseAdmin
    .from('activities')
    .insert({
      type: data.type,
      company_id: data.company_id,
      company_name: data.company_name,
      title: data.title,
      description: data.description,
      created_by: data.created_by,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add activity: ${error.message}`)
  return row as Activity
}

export async function getActivities(limit: number = 20): Promise<Activity[]> {
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch activities: ${error.message}`)
  return (data ?? []) as Activity[]
}

export async function getActivitiesByCompany(companyId: string, limit: number = 10): Promise<Activity[]> {
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch activities: ${error.message}`)
  return (data ?? []) as Activity[]
}

// === REMINDERS ===
// Uses the existing `reminders` table in Supabase

export async function addReminder(data: Omit<Reminder, 'id' | 'sent_at'>): Promise<Reminder> {
  const { data: row, error } = await supabaseAdmin
    .from('reminders')
    .insert({
      company_id: data.company_id,
      period: data.period,
      type: data.channel, // maps channel → type column
      recipient: data.company_name,
      subject: `Upomínka za období ${data.period}`,
      message: data.notes || '',
      sent_at: new Date().toISOString(),
      delivered: true,
      created_by: data.sent_by,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add reminder: ${error.message}`)

  // Also add as activity
  await addActivity({
    type: 'reminder_sent',
    company_id: data.company_id,
    company_name: data.company_name,
    title: 'Upomínka odeslána',
    description: `${data.channel === 'email' ? 'Email' : data.channel === 'phone' ? 'Telefon' : 'SMS'} za období ${data.period}`,
    created_by: data.sent_by,
  })

  return {
    id: row.id,
    company_id: row.company_id,
    company_name: data.company_name,
    period: row.period,
    type: data.type,
    channel: data.channel,
    sent_at: row.sent_at,
    sent_by: data.sent_by,
    notes: data.notes,
  }
}

export async function getReminders(limit: number = 20): Promise<Reminder[]> {
  const { data, error } = await supabaseAdmin
    .from('reminders')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch reminders: ${error.message}`)
  return (data ?? []).map(mapReminderRow)
}

export async function getRemindersByCompany(companyId: string): Promise<Reminder[]> {
  const { data, error } = await supabaseAdmin
    .from('reminders')
    .select('*')
    .eq('company_id', companyId)
    .order('sent_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch reminders: ${error.message}`)
  return (data ?? []).map(mapReminderRow)
}

export async function getReminderCountByCompanyAndPeriod(companyId: string, period: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('period', period)

  if (error) throw new Error(`Failed to count reminders: ${error.message}`)
  return count || 0
}

function mapReminderRow(row: any): Reminder {
  return {
    id: row.id,
    company_id: row.company_id,
    company_name: row.recipient || '',
    period: row.period,
    type: 'missing_docs',
    channel: row.type as 'email' | 'phone' | 'sms',
    sent_at: row.sent_at,
    sent_by: row.created_by || '',
    notes: row.message || undefined,
  }
}

// === ACTIVITY TYPE HELPERS (pure functions, same as before) ===

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
