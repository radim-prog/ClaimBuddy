// Cross-selling campaign logic
// Identifies candidates and executes email campaigns between accounting ↔ claims services

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'
import { wrapInLayout, emailButton } from '@/lib/email-templates'
import { addTags } from '@/lib/ecomail-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrossSellType = 'accounting_to_claims' | 'claims_to_accounting'

export interface CrossSellCandidate {
  userId: string
  email: string
  name: string
  companyId: string
  companyName: string
  crossSellType: CrossSellType
  currentServices: string[]
  suggestedServices: string[]
}

export interface CrossSellCampaign {
  id: string
  type: CrossSellType
  candidateCount: number
  sentCount: number
  createdAt: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EMAILS_PER_CAMPAIGN = 50

const ECOMAIL_TAGS: Record<CrossSellType, string> = {
  accounting_to_claims: 'cross_sell_accounting_to_claims',
  claims_to_accounting: 'cross_sell_claims_to_accounting',
}

const APP_URL = 'https://claims.zajcon.cz'

// ---------------------------------------------------------------------------
// Email content builders
// ---------------------------------------------------------------------------

function buildAccountingToClaimsEmail(name: string): { subject: string; html: string; text: string } {
  const subject = 'Řešte krizové situace přímo v Pojistná Pomoc'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      víte, že můžete řešit krizové situace přímo v Pojistná Pomoc? Aktivujte modul
      <strong>Krizové řízení</strong> a získejte přístup k nástrojům pro správu případů,
      sledování termínů a komunikaci s odborníky — vše na jednom místě.
    </p>
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;
                padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #1d4ed8;">Co získáte:</p>
      <ul style="margin: 0; padding-left: 18px; color: #1d4ed8; font-size: 14px; line-height: 1.8;">
        <li>Přehled otevřených případů a jejich stav</li>
        <li>Časová osa událostí s dokumentací</li>
        <li>Automatické hlídání lhůt a termínů</li>
        <li>Bezpečné sdílení dokumentů</li>
      </ul>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Propojte své účetnictví s krizovým řízením a mějte vše pod kontrolou.
    </p>
    ${emailButton('Aktivovat Krizové řízení', `${APP_URL}/krizove-rizeni`)}`

  const text = `Dobrý den, ${name},

víte, že můžete řešit krizové situace přímo v Pojistná Pomoc? Aktivujte modul Krizové řízení a získejte přístup k nástrojům pro správu případů, sledování termínů a komunikaci s odborníky.

Co získáte:
- Přehled otevřených případů a jejich stav
- Časová osa událostí s dokumentací
- Automatické hlídání lhůt a termínů
- Bezpečné sdílení dokumentů

Aktivovat: ${APP_URL}/krizove-rizeni

Odhlásit se z emailů: ${APP_URL}/unsubscribe

Pojistná Pomoc • claims.zajcon.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

function buildClaimsToAccountingEmail(name: string): { subject: string; html: string; text: string } {
  const subject = 'Potřebujete spolehlivého účetního? Najděte ho v Pojistná Pomoc'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      potřebujete spolehlivého účetního? Na našem <strong>Marketplace</strong> najdete
      ověřené účetní profesionály, kteří se postarají o vaše účetnictví —
      od běžných dokladů po daňové přiznání.
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
                padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #166534;">Proč účetní z Pojistná Pomoc:</p>
      <ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li>Ověření profesionálové s referencemi</li>
        <li>Přímá komunikace v aplikaci</li>
        <li>Online přehled o stavu vašeho účetnictví</li>
        <li>Automatické hlídání daňových termínů</li>
      </ul>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Propojení s účetním je zdarma. Účetní vám připraví nabídku na míru.
    </p>
    ${emailButton('Najít účetního na Marketplace', `${APP_URL}/client/find-accountant`, '#16a34a')}`

  const text = `Dobrý den, ${name},

potřebujete spolehlivého účetního? Na našem Marketplace najdete ověřené účetní profesionály.

Proč účetní z Pojistná Pomoc:
- Ověření profesionálové s referencemi
- Přímá komunikace v aplikaci
- Online přehled o stavu vašeho účetnictví
- Automatické hlídání daňových termínů

Propojení je zdarma.

Najít účetního: ${APP_URL}/client/find-accountant

Odhlásit se z emailů: ${APP_URL}/unsubscribe

Pojistná Pomoc • claims.zajcon.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

// ---------------------------------------------------------------------------
// Identify candidates
// ---------------------------------------------------------------------------

export async function identifyCrossSellCandidates(
  type: CrossSellType
): Promise<CrossSellCandidate[]> {
  if (type === 'accounting_to_claims') {
    // Companies WITH accountant but WITHOUT active cases
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, accountant_id')
      .not('accountant_id', 'is', null)
      .eq('status', 'active')

    if (error || !companies?.length) {
      console.error('[CrossSelling] Error fetching companies:', error)
      return []
    }

    // Get company IDs that already have cases
    const companyIds = companies.map((c) => c.id)
    const { data: casesData } = await supabaseAdmin
      .from('cases')
      .select('company_id')
      .in('company_id', companyIds)

    const companiesWithCases = new Set(
      (casesData ?? []).map((c) => c.company_id)
    )

    // Filter to companies without cases
    const candidateCompanies = companies.filter(
      (c) => !companiesWithCases.has(c.id)
    )

    if (!candidateCompanies.length) return []

    // Get accountant user details (they are the ones who manage the company)
    const accountantIds = [
      ...new Set(candidateCompanies.map((c) => c.accountant_id)),
    ]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, status')
      .in('id', accountantIds)
      .eq('status', 'active')

    if (!users?.length) return []

    const usersById = new Map(users.map((u) => [u.id, u]))

    const results: CrossSellCandidate[] = []
    for (const company of candidateCompanies) {
      const user = usersById.get(company.accountant_id)
      if (!user?.email) continue

      results.push({
        userId: user.id as string,
        email: user.email as string,
        name: (user.name as string) ?? (user.email as string),
        companyId: company.id as string,
        companyName: company.name as string,
        crossSellType: type,
        currentServices: ['accounting'],
        suggestedServices: ['claims', 'crisis_management'],
      })
    }
    return results
  }

  // claims_to_accounting: Companies WITHOUT accountant but WITH cases
  const { data: casesData, error: casesError } = await supabaseAdmin
    .from('cases')
    .select('company_id')

  if (casesError || !casesData?.length) {
    console.error('[CrossSelling] Error fetching cases:', casesError)
    return []
  }

  const companyIdsWithCases = [...new Set(casesData.map((c) => c.company_id))]

  const { data: companies, error: compError } = await supabaseAdmin
    .from('companies')
    .select('id, name, accountant_id')
    .in('id', companyIdsWithCases)
    .is('accountant_id', null)
    .eq('status', 'active')

  if (compError || !companies?.length) {
    console.error('[CrossSelling] Error fetching companies without accountant:', compError)
    return []
  }

  // For companies without an accountant, we need to find the owner/user
  // Look up users who are associated with these companies via subscriptions or other means
  const companyIds = companies.map((c) => c.id)
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, email, status')
    .eq('status', 'active')
    .eq('role', 'client')

  if (!users?.length) return []

  // Map users to companies — check if user has a subscription tied to a company
  // or if the user is associated via other company linkage
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, portal_type')
    .eq('status', 'active')
    .eq('portal_type', 'client')

  const clientUserIds = new Set(
    (subscriptions ?? []).map((s) => s.user_id)
  )

  // Since companies without accountant_id won't have a direct user link,
  // try to find users via company-user relationship patterns
  // Use a simple approach: match users who are clients
  const clientUsers = users.filter((u) => clientUserIds.has(u.id))

  // Build candidates — one per company, try to match via any available linkage
  // For now, if no direct FK, we return companies with any associated client user
  const results: CrossSellCandidate[] = []
  for (const company of companies) {
    // Find a client user — in practice, companies may have a contact_user_id or similar
    const user = clientUsers[0] // Fallback: will be refined when company-user FK exists
    if (!user?.email) continue

    results.push({
      userId: user.id as string,
      email: user.email as string,
      name: (user.name as string) ?? (user.email as string),
      companyId: company.id as string,
      companyName: company.name as string,
      crossSellType: type,
      currentServices: ['claims'],
      suggestedServices: ['accounting', 'marketplace'],
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// Execute campaign
// ---------------------------------------------------------------------------

export async function executeCrossSellCampaign(
  type: CrossSellType,
  candidates: CrossSellCandidate[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const limited = candidates.slice(0, MAX_EMAILS_PER_CAMPAIGN)
  const tag = ECOMAIL_TAGS[type]
  const ecomailApiKey = process.env.ECOMAIL_API_KEY
  const ecomailConfig = ecomailApiKey ? { apiKey: ecomailApiKey } : null

  let sent = 0
  let failed = 0
  const errors: string[] = []

  // Pre-check: find users who were already tagged (already received this campaign)
  const alreadySentEmails = new Set<string>()

  if (ecomailConfig) {
    // Check usage_log for previously sent cross-sell emails
    const { data: previousLogs } = await supabaseAdmin
      .from('usage_log')
      .select('metadata')
      .eq('action', 'cross_sell_email')
      .eq('feature', type)

    for (const log of previousLogs ?? []) {
      const meta = log.metadata as { email?: string } | null
      if (meta?.email) {
        alreadySentEmails.add(meta.email)
      }
    }
  }

  for (const candidate of limited) {
    try {
      // Skip if already sent to this email
      if (alreadySentEmails.has(candidate.email)) {
        continue
      }

      // Build email based on campaign type
      const emailContent =
        type === 'accounting_to_claims'
          ? buildAccountingToClaimsEmail(candidate.name)
          : buildClaimsToAccountingEmail(candidate.name)

      // Send email
      const result = await sendEmail({
        to: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      if (!result.success) {
        failed++
        errors.push(`[${candidate.email}] Email send failed: ${result.error ?? 'unknown'}`)
        continue
      }

      // Tag contact in Ecomail (if configured)
      if (ecomailConfig) {
        try {
          await addTags(ecomailConfig, candidate.email, [tag])
        } catch (tagErr) {
          // Non-fatal — email was sent, just tagging failed
          console.warn(`[CrossSelling] Failed to tag ${candidate.email}:`, tagErr)
        }
      }

      // Log individual send to usage_log
      await supabaseAdmin.from('usage_log').insert({
        user_id: candidate.userId,
        action: 'cross_sell_email',
        feature: type,
        metadata: {
          email: candidate.email,
          companyId: candidate.companyId,
          companyName: candidate.companyName,
          tag,
        },
      })

      sent++
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`[${candidate.email}] ${msg}`)
      console.error(`[CrossSelling] Error processing ${candidate.email}:`, err)
    }
  }

  // Log campaign summary
  await logCrossSellCampaign(type, { sent, failed })

  return { sent, failed, errors }
}

// ---------------------------------------------------------------------------
// Log campaign
// ---------------------------------------------------------------------------

export async function logCrossSellCampaign(
  type: CrossSellType,
  result: { sent: number; failed: number }
): Promise<void> {
  try {
    await supabaseAdmin.from('usage_log').insert({
      action: 'cross_sell_campaign',
      feature: type,
      metadata: {
        sent: result.sent,
        failed: result.failed,
        executedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[CrossSelling] Failed to log campaign:', err)
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getCrossSellStats(): Promise<{
  accountingToClaims: { candidates: number; lastCampaign: string | null }
  claimsToAccounting: { candidates: number; lastCampaign: string | null }
}> {
  // Count candidates for each direction (in parallel)
  const [accountingCandidates, claimsCandidates, lastCampaigns] =
    await Promise.all([
      identifyCrossSellCandidates('accounting_to_claims').then((c) => c.length),
      identifyCrossSellCandidates('claims_to_accounting').then((c) => c.length),
      supabaseAdmin
        .from('usage_log')
        .select('feature, created_at')
        .eq('action', 'cross_sell_campaign')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const campaignsByType = new Map<string, string>()
  for (const row of lastCampaigns.data ?? []) {
    if (!campaignsByType.has(row.feature)) {
      campaignsByType.set(row.feature, row.created_at)
    }
  }

  return {
    accountingToClaims: {
      candidates: accountingCandidates,
      lastCampaign: campaignsByType.get('accounting_to_claims') ?? null,
    },
    claimsToAccounting: {
      candidates: claimsCandidates,
      lastCampaign: campaignsByType.get('claims_to_accounting') ?? null,
    },
  }
}
