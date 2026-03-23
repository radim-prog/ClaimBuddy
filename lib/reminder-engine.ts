import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendNotificationEmail } from '@/lib/email-service'
import { sendWhatsAppMessage, isWhatsAppConfigured } from '@/lib/whatsapp'
import { isBusinessHours } from '@/lib/business-hours'

// ============================================
// TYPES
// ============================================

export type ReminderType = 'deadline' | 'missing_docs' | 'unpaid_invoice' | 'custom'
export type ReminderFrequency = 'daily' | 'every_3_days' | 'weekly' | 'biweekly' | 'adaptive'
export type ReminderStatus = 'active' | 'paused' | 'resolved' | 'expired'
export type DeliveryChannel = 'in_app' | 'email' | 'sms' | 'telegram' | 'whatsapp'
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped'

export type Reminder = {
  id: string
  company_id: string
  type: ReminderType
  message: string
  frequency: ReminderFrequency
  escalation_level: number
  status: ReminderStatus
  channels: DeliveryChannel[]
  metadata: Record<string, unknown>
  max_deliveries: number
  created_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type ReminderDelivery = {
  id: string
  reminder_id: string
  channel: DeliveryChannel
  scheduled_at: string
  delivered_at: string | null
  status: DeliveryStatus
  escalation_level: number
  message_text: string | null
  error: string | null
  created_at: string
}

// ============================================
// ESCALATION TEMPLATES — 5 levels (0-4)
// ============================================

const ESCALATION_TEMPLATES: Record<ReminderType, string[]> = {
  deadline: [
    'Připomínáme, že se blíží termín pro dodání podkladů za {period}. Prosím nahrajte je do systému.',
    'Termín pro podklady za {period} se rychle blíží. Zbývá málo času — prosím dodejte co nejdříve.',
    'Podklady za {period} stále chybí. Termín je {deadline}. Prosíme o urgentní dodání.',
    'URGENTNÍ: Podklady za {period} nebyly dodány. Termín {deadline} již brzy vyprší. Hrozí penále.',
    'POSLEDNÍ UPOZORNĚNÍ: Podklady za {period} chybí. Bez nich nemůžeme zpracovat účetnictví. Kontaktujte nás ihned.',
  ],
  missing_docs: [
    'V systému chybí některé doklady za {period}. Prosím doplňte je při příležitosti.',
    'Stále evidujeme chybějící doklady za {period}. Prosím nahrajte je do systému.',
    'Doklady k doplnění za {period} brzdí zpracování účetnictví. Prosíme o doplnění.',
    'DŮLEŽITÉ: Bez chybějících dokladů za {period} nelze uzavřít měsíc. Prosím doplňte urgentně.',
    'KRITICKÉ: Doklady za {period} stále chybí. Účetní uzávěrka je blokována. Kontaktujte nás.',
  ],
  unpaid_invoice: [
    'Faktura {invoice_number} bude brzy splatná. Nezapomeňte ji uhradit včas.',
    'Připomínáme splatnost faktury {invoice_number} ({amount} Kč). Prosím proveďte úhradu.',
    'Faktura {invoice_number} na {amount} Kč je po splatnosti. Prosíme o neprodlenou úhradu.',
    'UPOZORNĚNÍ: Faktura {invoice_number} je {days_overdue} dní po splatnosti. Hrozí penalizace.',
    'POSLEDNÍ UPOZORNĚNÍ: Neuhrazená faktura {invoice_number} ({amount} Kč, {days_overdue} dní po splatnosti). Hrozí právní kroky.',
  ],
  custom: [
    '{message}',
    'Připomínáme: {message}',
    'Důležité připomenutí: {message}',
    'Urgentní: {message}',
    'POSLEDNÍ UPOZORNĚNÍ: {message}',
  ],
}

// ============================================
// TIME SLOT RANDOMIZER
// Generates 20 delivery slots across a 2-3 week cycle,
// covering all hours (8-18) and all weekdays (Mon-Fri)
// ============================================

export function generateDeliverySlots(
  startDate: Date,
  count: number = 20,
  cycleDays: number = 18
): Date[] {
  const slots: Date[] = []
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

  // Deterministic but varied: spread slots across cycle
  const intervalMs = (cycleDays * 24 * 60 * 60 * 1000) / count

  for (let i = 0; i < count; i++) {
    const baseOffset = Math.round(intervalMs * i)
    // Add small jitter (±2 hours in ms)
    const jitter = Math.floor(seededRandom(startDate.getTime() + i) * 4 * 60 * 60 * 1000) - 2 * 60 * 60 * 1000
    const candidate = new Date(startDate.getTime() + baseOffset + jitter)

    // Ensure weekday (Mon-Fri)
    const dow = candidate.getDay()
    if (dow === 0) candidate.setDate(candidate.getDate() + 1)
    if (dow === 6) candidate.setDate(candidate.getDate() + 2)

    // Pick hour to cover full range across slots
    const hourIdx = i % hours.length
    candidate.setHours(hours[hourIdx], Math.floor(seededRandom(startDate.getTime() + i * 7) * 50), 0, 0)

    // Don't schedule in the past
    if (candidate.getTime() > Date.now()) {
      slots.push(candidate)
    }
  }

  return slots
}

/** Simple seeded PRNG (0-1 range) for deterministic randomization */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// ============================================
// CORE ENGINE FUNCTIONS
// ============================================

/**
 * Schedule a new reminder with pre-generated delivery slots
 */
export async function scheduleReminder(params: {
  companyId: string
  type: ReminderType
  message: string
  frequency?: ReminderFrequency
  channels?: DeliveryChannel[]
  metadata?: Record<string, unknown>
  maxDeliveries?: number
  createdBy?: string
  escalationLevel?: number
}): Promise<Reminder | null> {
  const {
    companyId,
    type,
    message,
    frequency = 'adaptive',
    channels = ['in_app'],
    metadata = {},
    maxDeliveries = 20,
    createdBy,
    escalationLevel = 0,
  } = params

  // Insert reminder
  const { data: reminder, error } = await supabaseAdmin
    .from('reminders')
    .insert({
      company_id: companyId,
      type,
      message,
      frequency,
      channels,
      metadata,
      max_deliveries: maxDeliveries,
      created_by: createdBy || null,
      escalation_level: escalationLevel,
    })
    .select()
    .single()

  if (error || !reminder) {
    console.error('Failed to create reminder:', error?.message)
    return null
  }

  // Generate delivery slots
  const slots = generateDeliverySlots(new Date(), maxDeliveries)
  const deliveries = []

  for (const slot of slots) {
    for (const channel of channels) {
      deliveries.push({
        reminder_id: reminder.id,
        channel,
        scheduled_at: slot.toISOString(),
        status: 'pending' as const,
        escalation_level: escalationLevel,
        message_text: null,
      })
    }
  }

  if (deliveries.length > 0) {
    await supabaseAdmin.from('reminder_deliveries').insert(deliveries)
  }

  return reminder as Reminder
}

/**
 * Get next delivery time for a reminder
 */
export async function getNextDeliveryTime(reminderId: string): Promise<Date | null> {
  const { data } = await supabaseAdmin
    .from('reminder_deliveries')
    .select('scheduled_at')
    .eq('reminder_id', reminderId)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single()

  return data ? new Date(data.scheduled_at) : null
}

/**
 * Escalate a reminder's message tone (0→1→2→3→4)
 */
export function escalateMessage(
  type: ReminderType,
  level: number,
  vars: Record<string, string> = {}
): { message: string; level: number } {
  const templates = ESCALATION_TEMPLATES[type] || ESCALATION_TEMPLATES.custom
  const clampedLevel = Math.min(level, templates.length - 1)
  let text = templates[clampedLevel]

  // Replace template variables
  for (const [key, value] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }

  return { message: text, level: clampedLevel }
}

/**
 * Process due deliveries — called by cron
 * Finds all pending deliveries scheduled before now, delivers them, and escalates
 */
export async function processDueDeliveries(): Promise<{ delivered: number; failed: number; escalated: number }> {
  const now = new Date().toISOString()
  let delivered = 0
  let failed = 0
  let escalated = 0

  // Get pending deliveries that are due
  const { data: dueDeliveries } = await supabaseAdmin
    .from('reminder_deliveries')
    .select(`
      *,
      reminders:reminder_id (id, company_id, type, message, escalation_level, status, metadata, max_deliveries, channels)
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (!dueDeliveries || dueDeliveries.length === 0) {
    return { delivered: 0, failed: 0, escalated: 0 }
  }

  for (const delivery of dueDeliveries) {
    const reminder = delivery.reminders as unknown as Reminder
    if (!reminder || reminder.status !== 'active') {
      // Skip if reminder no longer active
      await supabaseAdmin
        .from('reminder_deliveries')
        .update({ status: 'skipped' })
        .eq('id', delivery.id)
      continue
    }

    // Count delivered so far
    const { count } = await supabaseAdmin
      .from('reminder_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('reminder_id', reminder.id)
      .eq('status', 'delivered')

    const deliveredCount = count || 0

    // Check if max deliveries reached
    if (deliveredCount >= reminder.max_deliveries) {
      await supabaseAdmin
        .from('reminders')
        .update({ status: 'expired', updated_at: now })
        .eq('id', reminder.id)

      await supabaseAdmin
        .from('reminder_deliveries')
        .update({ status: 'skipped' })
        .eq('id', delivery.id)
      continue
    }

    // Determine escalation level based on delivery count
    const escalationLevel = getEscalationLevel(deliveredCount, reminder.max_deliveries)

    // Generate escalated message
    const vars: Record<string, string> = {
      message: reminder.message,
      ...Object.fromEntries(
        Object.entries(reminder.metadata || {}).map(([k, v]) => [k, String(v)])
      ),
    }
    const { message: escalatedText, level: newLevel } = escalateMessage(
      reminder.type as ReminderType,
      escalationLevel,
      vars
    )

    // Dispatch via channel
    const channelResult = await deliverViaChannel(
      delivery.channel as DeliveryChannel,
      reminder,
      escalatedText,
      newLevel
    )

    if (channelResult.ok) {
      await supabaseAdmin
        .from('reminder_deliveries')
        .update({
          status: 'delivered',
          delivered_at: now,
          escalation_level: newLevel,
          message_text: escalatedText,
        })
        .eq('id', delivery.id)
      delivered++
    } else {
      failed++
      await supabaseAdmin
        .from('reminder_deliveries')
        .update({ status: 'failed', error: channelResult.error || 'Unknown error' })
        .eq('id', delivery.id)
    }

    // Update reminder escalation level if it changed
    if (newLevel > reminder.escalation_level) {
      await supabaseAdmin
        .from('reminders')
        .update({ escalation_level: newLevel, updated_at: now })
        .eq('id', reminder.id)
      escalated++
    }
  }

  return { delivered, failed, escalated }
}

// ============================================
// CHANNEL DISPATCH
// ============================================

const REMINDER_TITLE_MAP: Record<ReminderType, string> = {
  deadline: 'Termín uzávěrky',
  missing_docs: 'Doklady k doplnění',
  unpaid_invoice: 'Neuhrazená faktura',
  custom: 'Upozornění',
}

/**
 * Look up the email of a company's owner.
 * Returns null when the company has no owner or the owner has no email stored.
 */
async function getUserEmail(companyId: string): Promise<string | null> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .single()

  if (!company?.owner_id) return null

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', company.owner_id)
    .single()

  return user?.email ?? null
}

async function deliverViaChannel(
  channel: DeliveryChannel,
  reminder: Reminder,
  messageText: string,
  escalationLevel: number
): Promise<{ ok: boolean; error?: string }> {
  const title = `Připomínka: ${REMINDER_TITLE_MAP[reminder.type as ReminderType] || 'Upozornění'}`
  const severity = escalationLevel >= 3 ? 'urgent' : escalationLevel >= 1 ? 'warning' : 'info'

  try {
    switch (channel) {
      case 'in_app': {
        // Create client_notification for popup/banner in client portal
        const { error } = await supabaseAdmin.from('client_notifications').insert({
          company_id: reminder.company_id,
          type: reminder.type,
          title,
          message: messageText,
          severity,
          auto_generated: true,
          metadata: { reminder_id: reminder.id, escalation_level: escalationLevel },
        })
        if (error) return { ok: false, error: error.message }

        // Also insert into chats table as system message for message thread visibility
        try {
          await supabaseAdmin.from('chats').insert({
            company_id: reminder.company_id,
            sender_id: reminder.created_by || null,
            sender_role: 'system',
            message: messageText,
            subject: title,
            status: 'active',
            started_by: 'system',
          })
        } catch { /* non-critical */ }

        return { ok: true }
      }

      case 'telegram': {
        // Look up company owner's telegram_chat_id
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('owner_id')
          .eq('id', reminder.company_id)
          .single()

        if (!company?.owner_id) return { ok: false, error: 'No company owner' }

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('telegram_chat_id')
          .eq('id', company.owner_id)
          .single()

        if (!user?.telegram_chat_id) return { ok: false, error: 'No telegram_chat_id for user' }

        const telegramText = [
          `<b>${title}</b>`,
          '',
          messageText,
        ].join('\n')

        const result = await sendTelegramMessage(user.telegram_chat_id, telegramText)
        return result.ok ? { ok: true } : { ok: false, error: result.error }
      }

      case 'email': {
        const userEmail = await getUserEmail(reminder.company_id)
        if (!userEmail) return { ok: false, error: 'No email address found for company owner' }

        const emailData: Record<string, string> = {
          subject: title,
          message: messageText,
          ...Object.fromEntries(
            Object.entries(reminder.metadata || {}).map(([k, v]) => [k, String(v)])
          ),
        }

        const result = await sendNotificationEmail(userEmail, reminder.type, emailData)
        return result.success ? { ok: true } : { ok: false, error: result.error ?? 'Email send failed' }
      }

      case 'whatsapp': {
        if (!isWhatsAppConfigured()) return { ok: false, error: 'WhatsApp not configured' }

        // Only send WhatsApp during business hours
        if (!isBusinessHours()) {
          return { ok: false, error: 'Outside business hours — delivery deferred' }
        }

        // Look up company owner's phone number
        const { data: waCompany } = await supabaseAdmin
          .from('companies')
          .select('owner_id')
          .eq('id', reminder.company_id)
          .single()

        if (!waCompany?.owner_id) return { ok: false, error: 'No company owner' }

        const { data: waUser } = await supabaseAdmin
          .from('users')
          .select('phone, notification_preferences')
          .eq('id', waCompany.owner_id)
          .single()

        if (!waUser?.phone) return { ok: false, error: 'No phone number for user' }

        // Check if user has WhatsApp enabled in preferences
        const waPrefs = waUser.notification_preferences as Record<string, unknown> | null
        if (waPrefs?.whatsapp === false) return { ok: false, error: 'WhatsApp disabled by user' }

        const waText = `*${title}*\n\n${messageText}`
        const waResult = await sendWhatsAppMessage(waUser.phone, waText)
        return waResult.ok ? { ok: true } : { ok: false, error: waResult.error }
      }

      case 'sms': {
        // SMS channel — future Twilio integration
        return { ok: false, error: 'SMS channel not yet implemented' }
      }

      default:
        return { ok: false, error: `Unknown channel: ${channel}` }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delivery error' }
  }
}

/**
 * Determine escalation level based on how far through the delivery cycle we are
 * 0-20%: level 0 (mild), 20-40%: level 1, 40-60%: level 2, 60-80%: level 3, 80-100%: level 4
 */
function getEscalationLevel(deliveredCount: number, maxDeliveries: number): number {
  if (maxDeliveries <= 0) return 0
  const progress = deliveredCount / maxDeliveries
  if (progress < 0.2) return 0
  if (progress < 0.4) return 1
  if (progress < 0.6) return 2
  if (progress < 0.8) return 3
  return 4
}

/**
 * Resolve a reminder (mark as resolved, skip remaining deliveries)
 */
export async function resolveReminder(reminderId: string): Promise<boolean> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('reminders')
    .update({ status: 'resolved', resolved_at: now, updated_at: now })
    .eq('id', reminderId)

  if (error) return false

  // Skip all pending deliveries
  await supabaseAdmin
    .from('reminder_deliveries')
    .update({ status: 'skipped' })
    .eq('reminder_id', reminderId)
    .eq('status', 'pending')

  return true
}
