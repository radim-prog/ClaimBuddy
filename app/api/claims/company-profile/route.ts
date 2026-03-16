import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/claims/company-profile?company_id=<uuid>
// Returns merged company profile from companies table, insurance_cases, monthly_closures,
// and documents — used by the claims module to show full accounting context for a client.
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  try {
    // Fetch all data in parallel — any single failure is non-fatal except the base company row
    const [companyResult, casesResult, closureResult, docsResult] = await Promise.allSettled([
      supabaseAdmin
        .from('companies')
        .select('id, name, ico, dic, legal_form, address, email, phone, status, created_at')
        .eq('id', companyId)
        .is('deleted_at', null)
        .single(),

      supabaseAdmin
        .from('insurance_cases')
        .select('id, status, claimed_amount, approved_amount, paid_amount')
        .eq('company_id', companyId),

      supabaseAdmin
        .from('monthly_closures')
        .select('period, status')
        .eq('company_id', companyId)
        .order('period', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabaseAdmin
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
    ])

    // Base company data is required — fail hard if missing
    if (companyResult.status === 'rejected' || companyResult.value.error) {
      const err =
        companyResult.status === 'rejected'
          ? companyResult.reason
          : companyResult.value.error
      if (err?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      throw err
    }

    const company = companyResult.value.data

    // Claims summary — aggregate from all cases for this company
    const cases =
      casesResult.status === 'fulfilled' && !casesResult.value.error
        ? (casesResult.value.data ?? [])
        : []

    let total_claimed = 0
    let total_approved = 0
    let total_paid = 0
    const statusCounts: Record<string, number> = {}

    for (const c of cases) {
      if (c.claimed_amount) total_claimed += c.claimed_amount
      if (c.approved_amount) total_approved += c.approved_amount
      total_paid += c.paid_amount ?? 0
      statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1
    }

    const claims_summary = {
      total_cases: cases.length,
      total_claimed,
      total_approved,
      total_paid,
      by_status: statusCounts,
    }

    // Accounting summary — latest closure + document count
    const latestClosure =
      closureResult.status === 'fulfilled' && !closureResult.value.error
        ? closureResult.value.data
        : null

    const documentCount =
      docsResult.status === 'fulfilled' && !docsResult.value.error
        ? (docsResult.value.count ?? 0)
        : 0

    const accounting_summary = {
      latest_closure_period: latestClosure?.period ?? null,
      latest_closure_status: latestClosure?.status ?? null,
      document_count: documentCount,
    }

    return NextResponse.json({
      profile: {
        company,
        claims_summary,
        accounting_summary,
      },
    })
  } catch (error) {
    console.error('[Claims company-profile] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
