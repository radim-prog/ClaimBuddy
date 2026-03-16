// Missing docs reminder trigger — TASK-017e
// Called after closure updates / auto-match to schedule or resolve reminders

import { supabaseAdmin } from '@/lib/supabase-admin'
import { scheduleReminder, resolveReminder, type ReminderFrequency, type DeliveryChannel } from '@/lib/reminder-engine'
import { calculateDetailedTaxImpact } from '@/lib/tax-impact'

export type MissingDocsFrequencyPreset = 'standard' | 'aggressive' | 'gentle' | 'off'

const FREQUENCY_MAP: Record<MissingDocsFrequencyPreset, { frequency: ReminderFrequency; maxReminders: number; cycleDays: number }> = {
  standard: { frequency: 'every_3_days', maxReminders: 20, cycleDays: 18 },
  aggressive: { frequency: 'daily', maxReminders: 30, cycleDays: 14 },
  gentle: { frequency: 'weekly', maxReminders: 10, cycleDays: 30 },
  off: { frequency: 'weekly', maxReminders: 0, cycleDays: 0 },
}

/**
 * Check unmatched expenses for a company+period and schedule/resolve reminders accordingly.
 * Called after:
 *   - closure status update (accountant closures route)
 *   - auto-match completion
 *   - bank statement upload + extraction
 */
export async function triggerMissingDocsReminder(
  companyId: string,
  period: string,
  createdBy?: string
): Promise<{ action: 'scheduled' | 'resolved' | 'skipped'; unmatched: number }> {
  // Count unmatched expenses for this company+period (excluding private/deposit)
  const { count: unmatchedCount } = await supabaseAdmin
    .from('bank_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('period', period)
    .lt('amount', 0)
    .is('matched_document_id', null)
    .is('matched_invoice_id', null)
    .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')

  const unmatched = unmatchedCount || 0

  // Find existing active reminder for this company+period+type
  const { data: existingReminders } = await supabaseAdmin
    .from('reminders')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'missing_docs')
    .eq('status', 'active')
    .contains('metadata', { period })

  // If no unmatched → resolve all active reminders
  if (unmatched === 0) {
    if (existingReminders && existingReminders.length > 0) {
      for (const r of existingReminders) {
        await resolveReminder(r.id)
      }
      return { action: 'resolved', unmatched: 0 }
    }
    return { action: 'skipped', unmatched: 0 }
  }

  // If unmatched > 0 and already has active reminder → skip (don't create duplicates)
  if (existingReminders && existingReminders.length > 0) {
    return { action: 'skipped', unmatched }
  }

  // Get company notification preferences for missing docs
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('notification_preferences, legal_form, vat_payer, owner_id')
    .eq('id', companyId)
    .single()

  if (!company) return { action: 'skipped', unmatched }

  // Check if reminders are enabled
  const prefs = (company.notification_preferences as Record<string, unknown>) || {}
  const missingDocsConfig = (prefs.missing_docs_reminder as Record<string, unknown>) || {}
  const preset = (missingDocsConfig.frequency as MissingDocsFrequencyPreset) || 'standard'
  const enabled = missingDocsConfig.enabled !== false // default: enabled

  if (!enabled || preset === 'off') {
    return { action: 'skipped', unmatched }
  }

  // Calculate total tax impact for motivation
  const { data: unmatchedTxs } = await supabaseAdmin
    .from('bank_transactions')
    .select('amount')
    .eq('company_id', companyId)
    .eq('period', period)
    .lt('amount', 0)
    .is('matched_document_id', null)
    .is('matched_invoice_id', null)
    .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')
    .limit(100)

  let totalImpact = 0
  for (const tx of unmatchedTxs || []) {
    const impact = calculateDetailedTaxImpact(Number(tx.amount), company.legal_form || 'osvc', !!company.vat_payer)
    totalImpact += impact.total
  }

  const impactStr = Math.round(totalImpact).toLocaleString('cs-CZ')

  // Determine channels
  const channels: DeliveryChannel[] = ['in_app']
  const clientPrefs = await getClientNotificationPrefs(company.owner_id)
  if (clientPrefs?.telegram) channels.push('telegram')
  if (clientPrefs?.email) channels.push('email')

  // Schedule reminder
  const config = FREQUENCY_MAP[preset]
  const maxReminders = (missingDocsConfig.max_reminders as number) || config.maxReminders

  await scheduleReminder({
    companyId,
    type: 'missing_docs',
    message: `Chybí ${unmatched} dokladů za ${period}. Dopad na daně: ${impactStr} Kč.`,
    frequency: config.frequency,
    channels,
    metadata: {
      period,
      unmatched_count: unmatched,
      tax_impact: Math.round(totalImpact),
    },
    maxDeliveries: maxReminders,
    createdBy,
  })

  return { action: 'scheduled', unmatched }
}

/**
 * Get client's own notification preferences (from users table)
 */
async function getClientNotificationPrefs(userId: string | null): Promise<{ email: boolean; telegram: boolean } | null> {
  if (!userId) return null
  const { data } = await supabaseAdmin
    .from('users')
    .select('notification_preferences, telegram_chat_id')
    .eq('id', userId)
    .single()

  if (!data) return null
  const prefs = (data.notification_preferences as Record<string, unknown>) || {}
  return {
    email: prefs.email === true,
    telegram: prefs.telegram === true && !!data.telegram_chat_id,
  }
}
