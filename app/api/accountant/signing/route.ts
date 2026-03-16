export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

/**
 * GET /api/accountant/signing
 * List signing jobs for the accountant
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('signing_jobs')
      .select('*, signing_signers(*)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.ilike('document_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Signing GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const jobs = (data as any[]) || []

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('[Signing GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/accountant/signing
 * Create a new draft signing job + signers
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { document_name, document_type, signature_type, company_id, template_id, note, signers } = body

    // Validate required fields
    if (!document_name) {
      return NextResponse.json({ error: 'document_name is required' }, { status: 400 })
    }
    if (!Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json({ error: 'At least one signer is required' }, { status: 400 })
    }
    for (const signer of signers) {
      if (!signer.name || !signer.email) {
        return NextResponse.json({ error: 'Each signer must have name and email' }, { status: 400 })
      }
    }

    // Insert signing job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('signing_jobs')
      .insert({
        document_name,
        document_type: document_type || null,
        signature_type: signature_type || 'electronic',
        company_id: company_id || null,
        template_id: template_id || null,
        note: note || null,
        status: 'draft',
        created_by: userId,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('[Signing POST] Job create error:', jobError)
      return NextResponse.json({ error: 'Failed to create signing job' }, { status: 500 })
    }

    // Insert signers
    const signerRows = signers.map((s: any, i: number) => ({
      signing_job_id: job.id,
      name: s.name,
      email: s.email,
      phone: s.phone || null,
      role: s.role || 'sign',
      status: 'waiting',
      order_index: i,
    }))

    const { data: insertedSigners, error: signersError } = await supabaseAdmin
      .from('signing_signers')
      .insert(signerRows)
      .select()

    if (signersError) {
      console.error('[Signing POST] Signers insert error:', signersError)
      // Clean up the job if signers fail
      await supabaseAdmin.from('signing_jobs').delete().eq('id', job.id)
      return NextResponse.json({ error: 'Failed to create signers' }, { status: 500 })
    }

    // Log creation event
    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: job.id,
      event_type: 'created',
      actor: userId,
      description: `Signing job "${document_name}" created`,
      metadata: { signers_count: signers.length },
    })

    return NextResponse.json(
      { job: { ...job, signers: insertedSigners || [] } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Signing POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
