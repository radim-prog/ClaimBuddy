import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

interface Opportunity {
  company_id: string
  opportunity_type: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

/**
 * POST /api/cron/company-opportunities
 * Recalculate cross-sell opportunities for all active companies.
 * Called by nightly cron.
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    // Fetch all active companies
    const { data: companies, error: compError } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico, vat_payer, has_employees, total_revenue, status')
      .eq('status', 'active')
      .is('deleted_at', null)

    if (compError) throw new Error(`Failed to fetch companies: ${compError.message}`)
    if (!companies || companies.length === 0) {
      return NextResponse.json({ message: 'No active companies', opportunities: 0 })
    }

    // Fetch company IDs that have insurance cases
    const { data: insuredCompanies, error: insError } = await supabaseAdmin
      .from('insurance_cases')
      .select('company_id')

    if (insError) throw new Error(`Failed to fetch insurance cases: ${insError.message}`)

    const insuredSet = new Set((insuredCompanies ?? []).map(r => r.company_id))

    // Generate opportunities
    const opportunities: Opportunity[] = []

    for (const company of companies) {
      const revenue = company.total_revenue || 0

      // Rule A: VAT registration required (obrat > 2M CZK and not VAT payer)
      if (!company.vat_payer && revenue > 2_000_000) {
        opportunities.push({
          company_id: company.id,
          opportunity_type: 'vat_registration',
          description: `${company.name}: obrat ${(revenue / 1_000_000).toFixed(1)}M Kč překračuje limit 2M — povinná registrace k DPH`,
          priority: 'high',
        })
      }

      // Rule B: Consider hiring employees (revenue > 500k, no employees)
      if (!company.has_employees && revenue > 500_000) {
        opportunities.push({
          company_id: company.id,
          opportunity_type: 'payroll',
          description: `${company.name}: obrat ${(revenue / 1_000).toFixed(0)}k Kč bez zaměstnanců — zvážit mzdovou agendu`,
          priority: 'medium',
        })
      }

      // Rule C: No insurance cases — offer insurance assistance
      if (!insuredSet.has(company.id)) {
        opportunities.push({
          company_id: company.id,
          opportunity_type: 'insurance',
          description: `${company.name}: žádné pojistné případy — nabídnout pojistnou pomoc`,
          priority: 'low',
        })
      }
    }

    // Upsert opportunities (don't overwrite dismissed ones)
    let upserted = 0
    for (const opp of opportunities) {
      const { error: upsertError } = await supabaseAdmin
        .from('company_opportunities')
        .upsert({
          company_id: opp.company_id,
          opportunity_type: opp.opportunity_type,
          description: opp.description,
          priority: opp.priority,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,opportunity_type',
          ignoreDuplicates: false,
        })
        // Don't overwrite dismissed opportunities
        .not('dismissed', 'eq', true)

      if (!upsertError) upserted++
    }

    // Clean up opportunities that no longer apply
    // (companies that now ARE vat payers, DO have employees, or DO have insurance)
    const companyIds = companies.map(c => c.id)

    // Remove stale vat_registration for companies that are now VAT payers
    const vatPayers = companies.filter(c => c.vat_payer).map(c => c.id)
    if (vatPayers.length > 0) {
      await supabaseAdmin
        .from('company_opportunities')
        .delete()
        .eq('opportunity_type', 'vat_registration')
        .in('company_id', vatPayers)
    }

    // Remove stale payroll for companies that now have employees
    const withEmployees = companies.filter(c => c.has_employees).map(c => c.id)
    if (withEmployees.length > 0) {
      await supabaseAdmin
        .from('company_opportunities')
        .delete()
        .eq('opportunity_type', 'payroll')
        .in('company_id', withEmployees)
    }

    // Remove stale insurance for companies that now have insurance cases
    const insuredIds = Array.from(insuredSet).filter(id => companyIds.includes(id))
    if (insuredIds.length > 0) {
      await supabaseAdmin
        .from('company_opportunities')
        .delete()
        .eq('opportunity_type', 'insurance')
        .in('company_id', insuredIds)
    }

    return NextResponse.json({
      companies_checked: companies.length,
      opportunities_generated: opportunities.length,
      upserted,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron/company-opportunities]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
