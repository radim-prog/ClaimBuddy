// Billing-as-a-service: accountant charges clients through platform
// Platform collects via Stripe, takes fee, tracks payouts
// No Stripe Connect — platform collects all payments, tracks payouts internally

import { supabaseAdmin } from './supabase-admin'
import { getStripe, findOrCreateStripeCustomer } from './stripe'

// ============================================
// TYPES
// ============================================

export type BillingConfigStatus = 'draft' | 'active' | 'paused' | 'cancelled' | 'suspended'

export type BillingConfig = {
  id: string
  company_id: string
  accountant_user_id: string
  monthly_fee: number
  currency: string
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  stripe_customer_id: string | null
  status: BillingConfigStatus
  platform_fee_pct: number
  activated_at: string | null
  cancelled_at: string | null
  suspended_at: string | null
  suspension_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BillingInvoiceStatus = 'pending' | 'paid' | 'failed' | 'overdue' | 'refunded' | 'waived'

export type BillingInvoice = {
  id: string
  billing_config_id: string
  company_id: string
  period: string
  amount: number
  platform_fee: number
  accountant_payout: number
  status: BillingInvoiceStatus
  stripe_invoice_id: string | null
  paid_at: string | null
  due_date: string
  reminder_count: number
  last_reminder_at: string | null
  escalated: boolean
  created_at: string
  updated_at: string
}

export type BillingPayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type BillingPayout = {
  id: string
  accountant_user_id: string
  period: string
  total_collected: number
  total_fee: number
  total_payout: number
  status: BillingPayoutStatus
  paid_at: string | null
  payment_reference: string | null
  created_at: string
  updated_at: string
}

const DEFAULT_PLATFORM_FEE_PCT = 10

// ============================================
// BILLING CONFIG CRUD
// ============================================

export async function createBillingConfig(data: {
  company_id: string
  accountant_user_id: string
  monthly_fee: number
  notes?: string
  platform_fee_pct?: number
}): Promise<BillingConfig> {
  const { data: config, error } = await supabaseAdmin
    .from('billing_configs')
    .insert({
      company_id: data.company_id,
      accountant_user_id: data.accountant_user_id,
      monthly_fee: data.monthly_fee,
      platform_fee_pct: data.platform_fee_pct ?? DEFAULT_PLATFORM_FEE_PCT,
      notes: data.notes || null,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create billing config: ${error.message}`)
  return config as BillingConfig
}

export async function updateBillingConfig(
  configId: string,
  updates: {
    monthly_fee?: number
    notes?: string
    status?: BillingConfigStatus
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('billing_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', configId)

  if (error) throw new Error(`Failed to update billing config: ${error.message}`)
}

export async function getBillingConfig(companyId: string): Promise<BillingConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to fetch billing config: ${error.message}`)
  }
  return data as BillingConfig
}

export async function getBillingConfigById(configId: string): Promise<BillingConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('id', configId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch billing config: ${error.message}`)
  }
  return data as BillingConfig
}

export async function getAccountantBillingConfigs(accountantUserId: string): Promise<BillingConfig[]> {
  const { data, error } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('accountant_user_id', accountantUserId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch billing configs: ${error.message}`)
  return (data ?? []) as BillingConfig[]
}

// ============================================
// ACTIVATE BILLING (create Stripe subscription)
// ============================================

export async function activateBilling(configId: string): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe()
  if (!stripe) return { success: false, error: 'Stripe not configured' }

  // Fetch config with company info
  const { data: config } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('id', configId)
    .single()

  if (!config) return { success: false, error: 'Config not found' }
  if (config.status === 'active') return { success: false, error: 'Already active' }

  // Fetch company details
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name, email, owner_id')
    .eq('id', config.company_id)
    .single()

  if (!company) return { success: false, error: 'Company not found' }

  // Fetch company owner for Stripe customer creation
  const { data: owner } = await supabaseAdmin
    .from('users')
    .select('id, email, name, stripe_customer_id')
    .eq('id', company.owner_id)
    .single()

  if (!owner?.email) return { success: false, error: 'Company owner has no email' }

  try {
    // Find or create Stripe customer (returns customer ID string or null)
    const customerId = await findOrCreateStripeCustomer(
      owner.id,
      owner.email,
      owner.name || company.name,
      owner.stripe_customer_id
    )

    if (!customerId) return { success: false, error: 'Failed to create Stripe customer' }

    // Save Stripe customer ID on user if it was just created
    if (!owner.stripe_customer_id) {
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', owner.id)
    }

    // Create a Stripe Price for this specific monthly fee
    const price = await stripe.prices.create({
      unit_amount: config.monthly_fee * 100, // CZK -> halere
      currency: 'czk',
      recurring: { interval: 'month' },
      product_data: {
        name: `Ucetni sluzby — ${company.name}`,
        metadata: {
          billing_config_id: configId,
          company_id: config.company_id,
        },
      },
    })

    // Create Stripe Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: {
        type: 'billing_service',
        billing_config_id: configId,
        company_id: config.company_id,
        accountant_user_id: config.accountant_user_id,
      },
    })

    // Update config with Stripe IDs and activate
    await supabaseAdmin
      .from('billing_configs')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: price.id,
        stripe_customer_id: customerId,
        status: 'active',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', configId)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Stripe error' }
  }
}

// ============================================
// PAUSE / CANCEL / SUSPEND
// ============================================

export async function pauseBilling(configId: string): Promise<void> {
  const stripe = getStripe()
  const config = await getBillingConfigById(configId)

  if (config?.stripe_subscription_id && stripe) {
    await stripe.subscriptions.update(config.stripe_subscription_id, {
      pause_collection: { behavior: 'mark_uncollectible' },
    })
  }

  await supabaseAdmin
    .from('billing_configs')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', configId)
}

export async function resumeBilling(configId: string): Promise<void> {
  const stripe = getStripe()
  const config = await getBillingConfigById(configId)

  if (config?.stripe_subscription_id && stripe) {
    await stripe.subscriptions.update(config.stripe_subscription_id, {
      pause_collection: '', // resume collection
    } as Parameters<typeof stripe.subscriptions.update>[1])
  }

  await supabaseAdmin
    .from('billing_configs')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)
}

export async function cancelBilling(configId: string): Promise<void> {
  const stripe = getStripe()
  const config = await getBillingConfigById(configId)

  if (config?.stripe_subscription_id && stripe) {
    await stripe.subscriptions.cancel(config.stripe_subscription_id)
  }

  await supabaseAdmin
    .from('billing_configs')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)
}

export async function suspendBilling(configId: string, reason: string): Promise<void> {
  const stripe = getStripe()
  const config = await getBillingConfigById(configId)

  if (config?.stripe_subscription_id && stripe) {
    await stripe.subscriptions.update(config.stripe_subscription_id, {
      pause_collection: { behavior: 'mark_uncollectible' },
    })
  }

  await supabaseAdmin
    .from('billing_configs')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)
}

// ============================================
// BILLING INVOICES
// ============================================

export async function generateMonthlyInvoices(period: string): Promise<{ generated: number; errors: number }> {
  // Fetch all active billing configs
  const { data: configs } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('status', 'active')

  let generated = 0
  let errors = 0

  for (const config of configs || []) {
    try {
      // Check if invoice already exists for this period
      const { data: existing } = await supabaseAdmin
        .from('billing_invoices')
        .select('id')
        .eq('billing_config_id', config.id)
        .eq('period', period)
        .maybeSingle()

      if (existing) continue // already generated

      const platformFee = Math.round(config.monthly_fee * (config.platform_fee_pct / 100))
      const accountantPayout = config.monthly_fee - platformFee

      // Due date: 15th of next month
      const [year, month] = period.split('-').map(Number)
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`

      const { error } = await supabaseAdmin
        .from('billing_invoices')
        .insert({
          billing_config_id: config.id,
          company_id: config.company_id,
          period,
          amount: config.monthly_fee,
          platform_fee: platformFee,
          accountant_payout: accountantPayout,
          status: 'pending',
          due_date: dueDate,
        })

      if (error) {
        errors++
      } else {
        generated++
      }
    } catch {
      errors++
    }
  }

  return { generated, errors }
}

export async function getBillingInvoices(params: {
  accountantUserId?: string
  companyId?: string
  period?: string
  status?: BillingInvoiceStatus
}): Promise<BillingInvoice[]> {
  let query = supabaseAdmin
    .from('billing_invoices')
    .select('*, billing_configs!inner(accountant_user_id)')
    .order('period', { ascending: false })

  if (params.accountantUserId) {
    query = query.eq('billing_configs.accountant_user_id', params.accountantUserId)
  }
  if (params.companyId) {
    query = query.eq('company_id', params.companyId)
  }
  if (params.period) {
    query = query.eq('period', params.period)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch billing invoices: ${error.message}`)
  return (data ?? []) as BillingInvoice[]
}

export async function markInvoicePaid(invoiceId: string, stripeInvoiceId?: string): Promise<void> {
  await supabaseAdmin
    .from('billing_invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_invoice_id: stripeInvoiceId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
}

export async function waiveInvoice(invoiceId: string): Promise<void> {
  await supabaseAdmin
    .from('billing_invoices')
    .update({
      status: 'waived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
}

// ============================================
// DUNNING (payment reminders)
// ============================================

export async function processOverdueInvoices(): Promise<{ reminded: number; escalated: number }> {
  const now = new Date()
  let reminded = 0
  let escalated = 0

  // Find overdue invoices (pending/failed + past due date)
  const { data: overdue } = await supabaseAdmin
    .from('billing_invoices')
    .select('*, billing_configs!inner(company_id, accountant_user_id)')
    .in('status', ['pending', 'failed'])
    .lt('due_date', now.toISOString().slice(0, 10))

  for (const invoice of overdue || []) {
    // Mark as overdue if not yet
    if (invoice.status !== 'overdue') {
      await supabaseAdmin
        .from('billing_invoices')
        .update({ status: 'overdue', updated_at: now.toISOString() })
        .eq('id', invoice.id)
    }

    // Escalation: after 3 reminders, flag for manual review
    if (invoice.reminder_count >= 3 && !invoice.escalated) {
      await supabaseAdmin
        .from('billing_invoices')
        .update({ escalated: true, updated_at: now.toISOString() })
        .eq('id', invoice.id)
      escalated++

      // Auto-suspend billing after 5 reminders
      if (invoice.reminder_count >= 5) {
        await suspendBilling(
          invoice.billing_config_id,
          'Neplaceni — automaticke pozastaveni po 5 upomienkach'
        )
      }
    }

    // Rate-limit reminders: max 1 per 3 days
    const lastReminder = invoice.last_reminder_at ? new Date(invoice.last_reminder_at) : null
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    if (!lastReminder || lastReminder < threeDaysAgo) {
      await supabaseAdmin
        .from('billing_invoices')
        .update({
          reminder_count: invoice.reminder_count + 1,
          last_reminder_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', invoice.id)
      reminded++
    }
  }

  return { reminded, escalated }
}

// ============================================
// PAYOUTS
// ============================================

export async function generatePayouts(period: string): Promise<{ generated: number }> {
  // Aggregate paid invoices by accountant for the period
  const { data: invoices } = await supabaseAdmin
    .from('billing_invoices')
    .select('amount, platform_fee, accountant_payout, billing_configs!inner(accountant_user_id)')
    .eq('period', period)
    .eq('status', 'paid')

  // Group by accountant
  const accountantMap = new Map<string, { collected: number; fees: number; payout: number }>()

  for (const inv of invoices || []) {
    // Extract accountant_user_id from the joined billing_configs
    const billingConfigs = inv.billing_configs as unknown as { accountant_user_id: string }
    const accId = billingConfigs.accountant_user_id
    const existing = accountantMap.get(accId) || { collected: 0, fees: 0, payout: 0 }
    existing.collected += inv.amount
    existing.fees += inv.platform_fee
    existing.payout += inv.accountant_payout
    accountantMap.set(accId, existing)
  }

  let generated = 0
  for (const [accountantId, totals] of accountantMap) {
    const { error } = await supabaseAdmin
      .from('billing_payouts')
      .upsert(
        {
          accountant_user_id: accountantId,
          period,
          total_collected: totals.collected,
          total_fee: totals.fees,
          total_payout: totals.payout,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'accountant_user_id,period' }
      )

    if (!error) generated++
  }

  return { generated }
}

export async function getPayouts(accountantUserId: string): Promise<BillingPayout[]> {
  const { data, error } = await supabaseAdmin
    .from('billing_payouts')
    .select('*')
    .eq('accountant_user_id', accountantUserId)
    .order('period', { ascending: false })

  if (error) throw new Error(`Failed to fetch payouts: ${error.message}`)
  return (data ?? []) as BillingPayout[]
}

export async function markPayoutPaid(payoutId: string, reference: string): Promise<void> {
  await supabaseAdmin
    .from('billing_payouts')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: reference,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
}

export async function markPayoutProcessing(payoutId: string): Promise<void> {
  await supabaseAdmin
    .from('billing_payouts')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getBillingDashboard(accountantUserId: string) {
  // Fetch all configs for this accountant
  const { data: configs } = await supabaseAdmin
    .from('billing_configs')
    .select('id, company_id, monthly_fee, status')
    .eq('accountant_user_id', accountantUserId)

  const allConfigs = configs || []
  const activeConfigs = allConfigs.filter((c) => c.status === 'active')
  const totalMRR = activeConfigs.reduce((sum, c) => sum + c.monthly_fee, 0)

  // Current period
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Current period invoices (only for active configs)
  const activeIds = activeConfigs.map((c) => c.id)
  let paidCount = 0
  let paidAmount = 0
  let overdueCount = 0
  let overdueAmount = 0

  if (activeIds.length > 0) {
    const { data: currentInvoices } = await supabaseAdmin
      .from('billing_invoices')
      .select('status, amount')
      .in('billing_config_id', activeIds)
      .eq('period', currentPeriod)

    for (const inv of currentInvoices || []) {
      if (inv.status === 'paid') {
        paidCount++
        paidAmount += inv.amount
      } else if (inv.status === 'overdue' || inv.status === 'failed') {
        overdueCount++
        overdueAmount += inv.amount
      }
    }
  }

  // Latest payout
  const { data: latestPayout } = await supabaseAdmin
    .from('billing_payouts')
    .select('*')
    .eq('accountant_user_id', accountantUserId)
    .order('period', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    totalClients: activeConfigs.length,
    totalClientsAll: allConfigs.length,
    totalMRR,
    currentPeriod,
    paidThisMonth: paidAmount,
    paidCount,
    overdueCount,
    overdueAmount,
    latestPayout: latestPayout as BillingPayout | null,
    platformFeePct: DEFAULT_PLATFORM_FEE_PCT,
  }
}

// ============================================
// STRIPE WEBHOOK HANDLER HELPERS
// ============================================

/**
 * Handle Stripe invoice.paid event for billing-service subscriptions.
 * Called from webhook handler when metadata.type === 'billing_service'.
 */
export async function handleStripeInvoicePaid(stripeInvoiceId: string, subscriptionId: string): Promise<void> {
  // Find the billing config by Stripe subscription ID
  const { data: config } = await supabaseAdmin
    .from('billing_configs')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!config) return // not a billing-service subscription

  // Find the matching billing_invoice by config + current period
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: invoice } = await supabaseAdmin
    .from('billing_invoices')
    .select('id')
    .eq('billing_config_id', config.id)
    .eq('period', period)
    .in('status', ['pending', 'overdue', 'failed'])
    .maybeSingle()

  if (invoice) {
    await markInvoicePaid(invoice.id, stripeInvoiceId)
  }
}

/**
 * Handle Stripe invoice.payment_failed event for billing-service subscriptions.
 */
export async function handleStripeInvoiceFailed(subscriptionId: string): Promise<void> {
  const { data: config } = await supabaseAdmin
    .from('billing_configs')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!config) return

  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await supabaseAdmin
    .from('billing_invoices')
    .update({ status: 'failed', updated_at: now.toISOString() })
    .eq('billing_config_id', config.id)
    .eq('period', period)
}
