// Billing-as-a-service: accountant charges clients through platform
// Platform collects via Stripe, takes fee, tracks payouts
// No Stripe Connect — platform collects all payments, tracks payouts internally

import { supabaseAdmin } from './supabase-admin'
import { getStripe, findOrCreateStripeCustomer } from './stripe'
import { generateInvoiceNumber } from './invoice-utils'

// ============================================
// TYPES
// ============================================

export type BillingConfigStatus = 'draft' | 'active' | 'paused' | 'cancelled' | 'suspended'

export type BillingConfig = {
  id: string
  company_id: string
  provider_id: string
  monthly_fee_czk: number
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
  config_id: string
  company_id: string
  period: string
  amount_due: number
  platform_fee: number
  provider_payout: number
  status: BillingInvoiceStatus
  stripe_invoice_id: string | null
  paid_at: string | null
  due_date: string
  escalation_level: number
  created_at: string
  updated_at: string
}

export type BillingPayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type BillingPayout = {
  id: string
  provider_id: string
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
  provider_id: string
  monthly_fee_czk: number
  notes?: string
  platform_fee_pct?: number
}): Promise<BillingConfig> {
  const { data: config, error } = await supabaseAdmin
    .from('billing_configs')
    .insert({
      company_id: data.company_id,
      provider_id: data.provider_id,
      monthly_fee_czk: data.monthly_fee_czk,
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
    monthly_fee_czk?: number
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
    .eq('provider_id', accountantUserId)
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
      unit_amount: config.monthly_fee_czk * 100, // CZK -> halere
      currency: 'czk',
      recurring: { interval: 'month' },
      product_data: {
        name: `Ucetni sluzby — ${company.name}`,
        metadata: {
          config_id: configId,
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
        config_id: configId,
        company_id: config.company_id,
        provider_id: config.provider_id,
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
        .eq('config_id', config.id)
        .eq('period', period)
        .maybeSingle()

      if (existing) continue // already generated

      const platformFee = Math.round(config.monthly_fee_czk * (config.platform_fee_pct / 100))
      const providerPayout = config.monthly_fee_czk - platformFee

      // Due date: 15th of next month
      const [year, month] = period.split('-').map(Number)
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`

      const { data: billingInvoice, error } = await supabaseAdmin
        .from('billing_invoices')
        .insert({
          config_id: config.id,
          company_id: config.company_id,
          period,
          amount_due: config.monthly_fee_czk,
          platform_fee: platformFee,
          provider_payout: providerPayout,
          status: 'pending',
          due_date: dueDate,
        })
        .select('id')
        .single()

      if (error) {
        errors++
      } else {
        generated++

        // Bridge: create corresponding record in invoices table
        try {
          const issueDate = new Date().toISOString().split('T')[0]
          const { invoiceNumber, variableSymbol, seriesId } = await generateInvoiceNumber(
            supabaseAdmin, Number(period.split('-')[0])
          )

          // Fetch company name for the invoice
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('name, ico, dic, address')
            .eq('id', config.company_id)
            .single()

          await supabaseAdmin
            .from('invoices')
            .insert({
              company_id: config.company_id,
              company_name: company?.name || '',
              type: 'income',
              invoice_number: invoiceNumber,
              variable_symbol: variableSymbol,
              issue_date: issueDate,
              due_date: dueDate,
              tax_date: issueDate,
              period,
              partner: {
                name: company?.name || '',
                ico: company?.ico || '',
                dic: company?.dic || '',
                address: typeof company?.address === 'object'
                  ? `${(company?.address as Record<string, string>)?.street || ''}, ${(company?.address as Record<string, string>)?.city || ''} ${(company?.address as Record<string, string>)?.zip || ''}`.trim()
                  : company?.address || '',
              },
              items: [{
                id: 'item-0',
                description: `Účetní služby za období ${period}`,
                quantity: 1,
                unit: 'měs',
                unit_price: config.monthly_fee_czk,
                vat_rate: 21,
                total_without_vat: config.monthly_fee_czk,
                total_with_vat: Math.round(config.monthly_fee_czk * 1.21),
              }],
              total_without_vat: config.monthly_fee_czk,
              total_vat: Math.round(config.monthly_fee_czk * 0.21),
              total_with_vat: Math.round(config.monthly_fee_czk * 1.21),
              number_series_id: seriesId,
              payment_status: 'unpaid',
              billing_invoice_id: billingInvoice.id,
              created_by: config.provider_id,
            })
        } catch {
          // Non-fatal: billing_invoice was created, invoices bridge failed
          // Will be retried or manually linked
        }
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
    .select('*, billing_configs!inner(provider_id)')
    .order('period', { ascending: false })

  if (params.accountantUserId) {
    query = query.eq('billing_configs.provider_id', params.accountantUserId)
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
  const now = new Date().toISOString()

  // 1. Mark billing_invoice as paid
  await supabaseAdmin
    .from('billing_invoices')
    .update({
      status: 'paid',
      paid_at: now,
      stripe_invoice_id: stripeInvoiceId || null,
      updated_at: now,
    })
    .eq('id', invoiceId)

  // 2. Fetch invoice to get company_id + period for master matice bridge
  const { data: invoice } = await supabaseAdmin
    .from('billing_invoices')
    .select('company_id, period')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  // 3. Upsert into monthly_payments (master matice)
  await supabaseAdmin
    .from('monthly_payments')
    .upsert(
      {
        company_id: invoice.company_id,
        period: invoice.period,
        paid: true,
        paid_at: now,
        updated_at: now,
      },
      { onConflict: 'company_id,period' }
    )

  // 4. Bridge: mark corresponding invoices record as paid
  await supabaseAdmin
    .from('invoices')
    .update({
      payment_status: 'paid',
      paid_at: now,
      updated_at: now,
    })
    .eq('billing_invoice_id', invoiceId)

  // 5. Fire & forget Raynet push
  import('@/lib/raynet-store').then(({ pushPaymentToRaynet }) => {
    pushPaymentToRaynet(invoice.company_id, invoice.period, true).catch(err =>
      console.error('[billing-service] Raynet auto-push error:', err)
    )
  }).catch(() => {
    // Raynet module not available, skip
  })
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
// DUNNING (overdue marking only)
// Actual reminders/escalation handled by invoice-reminders cron + reminder-engine
// ============================================

export async function processOverdueInvoices(): Promise<{ marked_overdue: number }> {
  const now = new Date()
  let marked_overdue = 0

  // Find invoices past due date that aren't already marked overdue/paid/written_off
  const { data: pastDue } = await supabaseAdmin
    .from('billing_invoices')
    .select('id, status')
    .in('status', ['pending'])
    .lt('due_date', now.toISOString().slice(0, 10))

  for (const invoice of pastDue || []) {
    await supabaseAdmin
      .from('billing_invoices')
      .update({ status: 'overdue', updated_at: now.toISOString() })
      .eq('id', invoice.id)
    marked_overdue++
  }

  return { marked_overdue }
}

// ============================================
// PAYOUTS
// ============================================

export async function generatePayouts(period: string): Promise<{ generated: number }> {
  // Aggregate paid invoices by provider for the period
  const { data: invoices } = await supabaseAdmin
    .from('billing_invoices')
    .select('amount_due, platform_fee, provider_payout, billing_configs!inner(provider_id)')
    .eq('period', period)
    .eq('status', 'paid')

  // Group by provider
  const providerMap = new Map<string, { collected: number; fees: number; payout: number }>()

  for (const inv of invoices || []) {
    const billingConfigs = inv.billing_configs as unknown as { provider_id: string }
    const providerId = billingConfigs.provider_id
    const existing = providerMap.get(providerId) || { collected: 0, fees: 0, payout: 0 }
    existing.collected += inv.amount_due
    existing.fees += inv.platform_fee
    existing.payout += inv.provider_payout
    providerMap.set(providerId, existing)
  }

  let generated = 0
  for (const [providerId, totals] of providerMap) {
    const { error } = await supabaseAdmin
      .from('billing_payouts')
      .upsert(
        {
          provider_id: providerId,
          period,
          total_collected: totals.collected,
          total_fee: totals.fees,
          total_payout: totals.payout,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider_id,period' }
      )

    if (!error) generated++
  }

  return { generated }
}

export async function getPayouts(accountantUserId: string): Promise<BillingPayout[]> {
  const { data, error } = await supabaseAdmin
    .from('billing_payouts')
    .select('*')
    .eq('provider_id', accountantUserId)
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
    .select('id, company_id, monthly_fee_czk, status')
    .eq('provider_id', accountantUserId)

  const allConfigs = configs || []
  const activeConfigs = allConfigs.filter((c) => c.status === 'active')
  const totalMRR = activeConfigs.reduce((sum, c) => sum + c.monthly_fee_czk, 0)

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
      .select('status, amount_due')
      .in('config_id', activeIds)
      .eq('period', currentPeriod)

    for (const inv of currentInvoices || []) {
      if (inv.status === 'paid') {
        paidCount++
        paidAmount += inv.amount_due
      } else if (inv.status === 'overdue' || inv.status === 'failed') {
        overdueCount++
        overdueAmount += inv.amount_due
      }
    }
  }

  // Latest payout
  const { data: latestPayout } = await supabaseAdmin
    .from('billing_payouts')
    .select('*')
    .eq('provider_id', accountantUserId)
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
    .eq('config_id', config.id)
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
    .eq('config_id', config.id)
    .eq('period', period)
}
