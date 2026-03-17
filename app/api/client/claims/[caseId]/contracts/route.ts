import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/claims/[caseId]/contracts
 * Returns signing jobs linked to this case for the client to view/sign.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId } = await params

  // Verify user owns a company linked to this case
  const { data: ic } = await supabaseAdmin
    .from('insurance_cases')
    .select('id, company_id')
    .eq('id', caseId)
    .single()

  if (!ic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (ic.company_id) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', ic.company_id)
      .eq('owner_id', userId)
      .single()

    if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: jobs } = await supabaseAdmin
    .from('signing_jobs')
    .select('id, document_name, document_type, status, note, created_at, signers:signing_signers(name, email, status)')
    .eq('insurance_case_id', caseId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ contracts: jobs || [] })
}

/**
 * PATCH /api/client/claims/[caseId]/contracts
 * Client consent — marks a signing job as accepted/signed by client
 * Body: { jobId: string, consent: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId } = await params
  const body = await request.json()
  const { jobId, consent } = body

  if (!jobId || typeof consent !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Verify ownership
  const { data: ic } = await supabaseAdmin
    .from('insurance_cases')
    .select('id, company_id')
    .eq('id', caseId)
    .single()

  if (!ic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (ic.company_id) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', ic.company_id)
      .eq('owner_id', userId)
      .single()

    if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify job belongs to this case
  const { data: job } = await supabaseAdmin
    .from('signing_jobs')
    .select('id, status')
    .eq('id', jobId)
    .eq('insurance_case_id', caseId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (consent) {
    // Mark as signed
    await supabaseAdmin
      .from('signing_jobs')
      .update({ status: 'signed', signed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', jobId)

    // Update signer status
    await supabaseAdmin
      .from('signing_signers')
      .update({ status: 'signed', signed_at: new Date().toISOString() })
      .eq('signing_job_id', jobId)

    // Log event
    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: jobId,
      event_type: 'signed',
      actor: userId,
      description: 'Klient podepsal dokument',
    })

    // Update power_of_attorney_status on the insurance case if it's a POA
    const { data: fullJob } = await supabaseAdmin
      .from('signing_jobs')
      .select('document_type')
      .eq('id', jobId)
      .single()

    if (fullJob?.document_type === 'power_of_attorney') {
      await supabaseAdmin
        .from('insurance_cases')
        .update({ power_of_attorney_status: 'signed', updated_at: new Date().toISOString() })
        .eq('id', caseId)
    }
  }

  return NextResponse.json({ success: true })
}
