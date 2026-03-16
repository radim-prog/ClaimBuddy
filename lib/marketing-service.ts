// Marketing service — high-level Ecomail integration
// Handles segmentation, automation triggers, GDPR consent

import {
  subscribe, unsubscribe, updateSubscriber, addTags, removeTags,
  triggerAutomation, getLists, getCampaigns, getCampaignStats, getAutomations,
} from './ecomail-client'
import { supabaseAdmin } from './supabase-admin'

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------

function getConfig() {
  const apiKey = process.env.ECOMAIL_API_KEY
  if (!apiKey) return null
  return { apiKey }
}

const LIST_IDS = {
  clients: process.env.ECOMAIL_LIST_ID_CLIENTS || '',
  accountants: process.env.ECOMAIL_LIST_ID_ACCOUNTANTS || '',
}

// Automation IDs (configured in Ecomail UI, referenced by ID)
const AUTOMATION_IDS = {
  onboarding_drip: process.env.ECOMAIL_AUTOMATION_ONBOARDING || '',
  trial_reminder: process.env.ECOMAIL_AUTOMATION_TRIAL || '',
  upsell_sequence: process.env.ECOMAIL_AUTOMATION_UPSELL || '',
  win_back: process.env.ECOMAIL_AUTOMATION_WINBACK || '',
}

// Segment tags
export const SEGMENT_TAGS = {
  // User type
  CLIENT: 'client',
  ACCOUNTANT: 'accountant',
  ADMIN: 'admin',
  // Status
  TRIAL: 'trial',
  PAYING: 'paying',
  FREE: 'free',
  CHURNED: 'churned',
  // Relationship
  HAS_ACCOUNTANT: 'has_accountant',
  NO_ACCOUNTANT: 'no_accountant',
  // Plan
  PLAN_FREE: 'plan_free',
  PLAN_STARTER: 'plan_starter',
  PLAN_PROFESSIONAL: 'plan_professional',
  PLAN_ENTERPRISE: 'plan_enterprise',
} as const

// ---------------------------------------------------------------
// Contact Management
// ---------------------------------------------------------------

export async function syncContact(userId: string): Promise<{ synced: boolean; error?: string }> {
  const config = getConfig()
  if (!config) return { synced: false, error: 'Ecomail not configured' }

  // Fetch user data
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, notification_preferences, company_id')
    .eq('id', userId)
    .single()

  if (!user?.email) return { synced: false, error: 'No email' }

  // Check marketing consent
  const prefs = user.notification_preferences as Record<string, unknown> || {}
  if (prefs.marketing_emails === false) {
    // User opted out — unsubscribe from marketing list
    try {
      const listId = user.role === 'accountant' || user.role === 'admin'
        ? LIST_IDS.accountants
        : LIST_IDS.clients
      if (listId) await unsubscribe(config, listId, user.email)
    } catch {
      // ignore errors on unsubscribe
    }
    return { synced: true }
  }

  // Determine tags
  const tags = await computeUserTags(user)

  // Determine list
  const listId = user.role === 'accountant' || user.role === 'admin'
    ? LIST_IDS.accountants
    : LIST_IDS.clients

  if (!listId) return { synced: false, error: 'List not configured' }

  // Split name
  const nameParts = (user.name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] || undefined
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  try {
    await updateSubscriber(config, listId, user.email, {
      firstName,
      lastName,
      tags,
      customFields: {
        user_id: user.id,
        role: user.role || 'client',
      },
    })
    return { synced: true }
  } catch (err) {
    return { synced: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function computeUserTags(user: { id: string; role: string | null; company_id: string | null }): Promise<string[]> {
  const tags: string[] = []

  // Role
  if (user.role === 'accountant') tags.push(SEGMENT_TAGS.ACCOUNTANT)
  else if (user.role === 'admin') tags.push(SEGMENT_TAGS.ADMIN)
  else tags.push(SEGMENT_TAGS.CLIENT)

  // Only compute client-specific tags for clients
  if (user.role === 'client' || !user.role) {
    // Subscription status
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, trial_ends_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sub) {
      if (sub.status === 'trialing') tags.push(SEGMENT_TAGS.TRIAL)
      else if (sub.status === 'active') tags.push(SEGMENT_TAGS.PAYING)
      else tags.push(SEGMENT_TAGS.FREE)

      // Plan tag
      const planTag = `plan_${sub.plan || 'free'}` as string
      if (Object.values(SEGMENT_TAGS).includes(planTag as typeof SEGMENT_TAGS[keyof typeof SEGMENT_TAGS])) {
        tags.push(planTag)
      }
    } else {
      tags.push(SEGMENT_TAGS.FREE)
      tags.push(SEGMENT_TAGS.PLAN_FREE)
    }

    // Has accountant?
    if (user.company_id) {
      tags.push(SEGMENT_TAGS.HAS_ACCOUNTANT)
    } else {
      tags.push(SEGMENT_TAGS.NO_ACCOUNTANT)
    }
  }

  return tags
}

// ---------------------------------------------------------------
// Automation Triggers
// ---------------------------------------------------------------

export async function triggerOnboardingSequence(email: string): Promise<void> {
  const config = getConfig()
  if (!config || !AUTOMATION_IDS.onboarding_drip) return
  try {
    await triggerAutomation(config, AUTOMATION_IDS.onboarding_drip, email)
  } catch (err) {
    console.error('[Marketing] Onboarding trigger failed:', err)
  }
}

export async function triggerTrialReminder(email: string): Promise<void> {
  const config = getConfig()
  if (!config || !AUTOMATION_IDS.trial_reminder) return
  try {
    await triggerAutomation(config, AUTOMATION_IDS.trial_reminder, email)
  } catch (err) {
    console.error('[Marketing] Trial reminder trigger failed:', err)
  }
}

export async function triggerUpsellSequence(email: string): Promise<void> {
  const config = getConfig()
  if (!config || !AUTOMATION_IDS.upsell_sequence) return
  try {
    await triggerAutomation(config, AUTOMATION_IDS.upsell_sequence, email)
  } catch (err) {
    console.error('[Marketing] Upsell trigger failed:', err)
  }
}

export async function triggerWinBackSequence(email: string): Promise<void> {
  const config = getConfig()
  if (!config || !AUTOMATION_IDS.win_back) return
  try {
    await triggerAutomation(config, AUTOMATION_IDS.win_back, email)
  } catch (err) {
    console.error('[Marketing] Win-back trigger failed:', err)
  }
}

// ---------------------------------------------------------------
// Campaign & Stats (for admin UI)
// ---------------------------------------------------------------

export async function getMarketingOverview() {
  const config = getConfig()
  if (!config) return null

  try {
    const [lists, campaigns, automations] = await Promise.all([
      getLists(config),
      getCampaigns(config),
      getAutomations(config),
    ])

    return { lists, campaigns, automations }
  } catch (err) {
    console.error('[Marketing] Overview fetch failed:', err)
    return null
  }
}

export async function getMarketingCampaignStats(campaignId: number) {
  const config = getConfig()
  if (!config) return null

  try {
    return await getCampaignStats(config, campaignId)
  } catch (err) {
    console.error('[Marketing] Campaign stats fetch failed:', err)
    return null
  }
}

// ---------------------------------------------------------------
// GDPR: Update marketing consent
// ---------------------------------------------------------------

export async function updateMarketingConsent(userId: string, consent: boolean): Promise<void> {
  // Update user preferences
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('notification_preferences, email')
    .eq('id', userId)
    .single()

  const prefs = (user?.notification_preferences as Record<string, unknown>) || {}
  prefs.marketing_emails = consent

  await supabaseAdmin
    .from('users')
    .update({ notification_preferences: prefs })
    .eq('id', userId)

  // If opted out, unsubscribe from Ecomail
  if (!consent && user?.email) {
    const config = getConfig()
    if (config && LIST_IDS.clients) {
      try {
        await unsubscribe(config, LIST_IDS.clients, user.email)
      } catch {
        // best effort
      }
    }
  }

  // If opted in, sync to Ecomail
  if (consent) {
    await syncContact(userId)
  }
}
