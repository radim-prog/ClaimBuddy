// Raynet CRM store — mapping, sync, auto-push logic

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getAccountingBusinessCases,
  updateBusinessCasePhase,
  createBusinessCase,
  parseBCName,
  PHASE_VYHRA,
  PHASE_FAKTURACE,
} from '@/lib/raynet'
import type { RaynetMapping, SyncResult } from '@/lib/types/raynet'

// ============================================================
// MAPPING CRUD
// ============================================================

export async function getRaynetMappings(): Promise<RaynetMapping[]> {
  // Get companies with monthly_reporting=true + their raynet mapping + sync state
  const { data: companies, error } = await supabaseAdmin
    .from('companies')
    .select('id, name, raynet_company_id, status, monthly_reporting')
    .eq('monthly_reporting', true)
    .neq('status', 'inactive')
    .order('name')

  if (error) throw new Error(`Failed to get companies: ${error.message}`)

  // Get sync states
  const companyIds = (companies || []).map(c => c.id)
  const { data: syncStates } = await supabaseAdmin
    .from('raynet_sync_state')
    .select('company_id, last_sync_at, sync_status')
    .in('company_id', companyIds)

  const syncMap = new Map(
    (syncStates || []).map(s => [s.company_id, s])
  )

  // Get Raynet company names for mapped ones
  const raynetIds = (companies || [])
    .filter(c => c.raynet_company_id)
    .map(c => c.raynet_company_id)

  let raynetNameMap = new Map<number, string>()
  if (raynetIds.length > 0) {
    const { data: links } = await supabaseAdmin
      .from('raynet_payment_links')
      .select('company_id, raynet_bc_name')
      .in('company_id', companyIds)
      .limit(1)

    // We'll store raynet names from the sync state or fetch them
    // For now, we'll just use what we have
    void links
  }

  return (companies || []).map(c => {
    const sync = syncMap.get(c.id)
    return {
      company_id: c.id,
      company_name: c.name,
      raynet_company_id: c.raynet_company_id || null,
      raynet_company_name: raynetNameMap.get(c.raynet_company_id) || null,
      last_sync_at: sync?.last_sync_at || null,
      sync_status: (sync?.sync_status as RaynetMapping['sync_status']) || null,
    }
  })
}

export async function mapCompanyToRaynet(
  companyId: string,
  raynetCompanyId: number,
  raynetCompanyName?: string
): Promise<void> {
  // Update company with raynet_company_id
  const { error } = await supabaseAdmin
    .from('companies')
    .update({ raynet_company_id: raynetCompanyId })
    .eq('id', companyId)

  if (error) throw new Error(`Failed to map company: ${error.message}`)

  // Upsert sync state
  await supabaseAdmin
    .from('raynet_sync_state')
    .upsert({
      company_id: companyId,
      sync_status: 'never_synced',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })
}

export async function unmapCompanyRaynet(companyId: string): Promise<void> {
  // Remove raynet_company_id
  const { error } = await supabaseAdmin
    .from('companies')
    .update({ raynet_company_id: null })
    .eq('id', companyId)

  if (error) throw new Error(`Failed to unmap company: ${error.message}`)

  // Remove sync state
  await supabaseAdmin
    .from('raynet_sync_state')
    .delete()
    .eq('company_id', companyId)

  // Remove payment links
  await supabaseAdmin
    .from('raynet_payment_links')
    .delete()
    .eq('company_id', companyId)
}

// ============================================================
// AUTO-PUSH (called from payment matrix PUT)
// ============================================================

export async function pushPaymentToRaynet(
  companyId: string,
  period: string,
  paid: boolean
): Promise<void> {
  // 1. Check if company is mapped to Raynet
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('raynet_company_id')
    .eq('id', companyId)
    .single()

  if (!company?.raynet_company_id) return // Not mapped, skip

  // 2. Find existing payment link
  const { data: link } = await supabaseAdmin
    .from('raynet_payment_links')
    .select('raynet_bc_id')
    .eq('company_id', companyId)
    .eq('period', period)
    .eq('is_extra_service', false)
    .maybeSingle()

  if (link?.raynet_bc_id) {
    // 3a. Update existing BC phase
    await updateBusinessCasePhase(
      link.raynet_bc_id,
      paid ? PHASE_VYHRA : PHASE_FAKTURACE
    )
  } else {
    // 3b. Create new BC and save link
    const [year, month] = period.split('-')
    const bcName = `účto ${month} ${year}`

    const result = await createBusinessCase({
      name: bcName,
      companyId: company.raynet_company_id,
      validFrom: `${period}-01`,
    })

    // Update phase if paid
    if (paid) {
      await updateBusinessCasePhase(result.id, PHASE_VYHRA)
    }

    // Save link
    await supabaseAdmin
      .from('raynet_payment_links')
      .upsert({
        company_id: companyId,
        period,
        raynet_bc_id: result.id,
        raynet_bc_name: bcName,
        is_extra_service: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,raynet_bc_id' })
  }

  // Update sync state
  await supabaseAdmin
    .from('raynet_sync_state')
    .upsert({
      company_id: companyId,
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced',
      sync_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })
}

// ============================================================
// CRON SYNC (pull from Raynet)
// ============================================================

export async function syncFromRaynet(year?: number): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, updated: 0, created: 0, errors: [] }

  try {
    // 1. Get all accounting BCs from Raynet
    const bcs = await getAccountingBusinessCases(year)

    // 2. Get company mapping (raynet_company_id → company_id)
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, raynet_company_id')
      .not('raynet_company_id', 'is', null)

    const companyMap = new Map<number, string>()
    for (const c of companies || []) {
      if (c.raynet_company_id) {
        companyMap.set(c.raynet_company_id, c.id)
      }
    }

    // 3. Process each BC
    for (const bc of bcs) {
      try {
        const companyId = companyMap.get(bc.company.id)
        if (!companyId) continue // Not mapped, skip

        const { period, isExtra } = parseBCName(bc.name, bc.validFrom)

        // Skip cancelled
        if (bc.status === 'G_STORNO') continue

        // Determine paid status from phase
        const isPaid = bc.businessCasePhase.id === PHASE_VYHRA || bc.status === 'E_WIN'

        // Upsert payment link
        await supabaseAdmin
          .from('raynet_payment_links')
          .upsert({
            company_id: companyId,
            period,
            raynet_bc_id: bc.id,
            raynet_bc_name: bc.name,
            raynet_amount: bc.totalAmount || null,
            is_extra_service: isExtra,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'company_id,raynet_bc_id' })

        // For regular BCs (not extra services), sync payment status
        if (!isExtra) {
          const { data: existing } = await supabaseAdmin
            .from('monthly_payments')
            .select('paid')
            .eq('company_id', companyId)
            .eq('period', period)
            .maybeSingle()

          const currentPaid = existing?.paid || false

          if (currentPaid !== isPaid) {
            await supabaseAdmin
              .from('monthly_payments')
              .upsert({
                company_id: companyId,
                period,
                paid: isPaid,
                paid_at: isPaid ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'company_id,period' })
            result.updated++
          }
        }

        result.synced++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`BC ${bc.id} (${bc.name}): ${msg}`)
      }
    }

    // 4. Update sync states for all mapped companies
    const mappedCompanyIds = [...companyMap.values()]
    for (const companyId of mappedCompanyIds) {
      await supabaseAdmin
        .from('raynet_sync_state')
        .upsert({
          company_id: companyId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
          sync_error: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    result.errors.push(`Global sync error: ${msg}`)
  }

  return result
}

// ============================================================
// AUTO-CREATE BCs (1st day of month)
// ============================================================

export async function createMonthlyBCs(period: string): Promise<number> {
  let created = 0

  // Get all mapped active companies
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name, raynet_company_id')
    .not('raynet_company_id', 'is', null)
    .eq('monthly_reporting', true)
    .neq('status', 'inactive')

  if (!companies || companies.length === 0) return 0

  // Get existing links for this period
  const { data: existingLinks } = await supabaseAdmin
    .from('raynet_payment_links')
    .select('company_id, period')
    .eq('period', period)
    .eq('is_extra_service', false)

  const existingSet = new Set(
    (existingLinks || []).map(l => l.company_id)
  )

  const [year, month] = period.split('-')

  for (const company of companies) {
    if (existingSet.has(company.id)) continue // Already has BC for this period

    try {
      const bcName = `účto ${month} ${year}`

      const result = await createBusinessCase({
        name: bcName,
        companyId: company.raynet_company_id!,
        validFrom: `${period}-01`,
      })

      // Save link
      await supabaseAdmin
        .from('raynet_payment_links')
        .upsert({
          company_id: company.id,
          period,
          raynet_bc_id: result.id,
          raynet_bc_name: bcName,
          is_extra_service: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,raynet_bc_id' })

      created++
    } catch (err) {
      console.error(`Failed to create BC for ${company.name}:`, err)
    }
  }

  return created
}
