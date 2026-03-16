export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { createContract, cancelContract } from '@/lib/signi-client'
import type { SigniSignerInput } from '@/lib/types/signing'

function mapSignerRole(role: string, signatureType: string): 'sign' | 'approve' | 'sign_bank_id_sign' {
  if (role === 'approve') return 'approve'
  if (signatureType === 'bank_id_sign' || signatureType === 'qualified') return 'sign_bank_id_sign'
  return 'sign'
}

/**
 * GET /api/accountant/signing/[jobId]
 * Get job detail + signers + events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { jobId } = await params

    // Parallel fetch: job, signers, events
    const [jobResult, signersResult, eventsResult] = await Promise.all([
      supabaseAdmin
        .from('signing_jobs')
        .select('*')
        .eq('id', jobId)
        .single(),
      supabaseAdmin
        .from('signing_signers')
        .select('*')
        .eq('signing_job_id', jobId)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('signing_events')
        .select('*')
        .eq('signing_job_id', jobId)
        .order('created_at', { ascending: false }),
    ])

    if (jobResult.error || !jobResult.data) {
      return NextResponse.json({ error: 'Signing job not found' }, { status: 404 })
    }

    const job = jobResult.data

    // Ownership check: creator or admin
    if (job.created_by !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      job,
      signers: signersResult.data || [],
      events: eventsResult.data || [],
    })
  } catch (error) {
    console.error('[Signing GET jobId] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/accountant/signing/[jobId]
 * Actions on a job: send or cancel
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { jobId } = await params
    const body = await request.json()
    const { action } = body

    // Load job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('signing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Signing job not found' }, { status: 404 })
    }

    // Ownership check
    if (job.created_by !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'send') {
      return await handleSend(job, body, userId)
    } else if (action === 'cancel') {
      return await handleCancel(job, userId)
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "send" or "cancel"' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Signing PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSend(
  job: any,
  body: any,
  userId: string
): Promise<NextResponse> {
  // Verify status
  if (job.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft jobs can be sent' }, { status: 400 })
  }

  // Load signers
  const { data: signers } = await supabaseAdmin
    .from('signing_signers')
    .select('*')
    .eq('signing_job_id', job.id)
    .order('order_index', { ascending: true })

  if (!signers || signers.length === 0) {
    return NextResponse.json({ error: 'No signers found for this job' }, { status: 400 })
  }

  // Get user's Signi API key
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('signi_api_key')
    .eq('id', userId)
    .single()

  const apiKey = user?.signi_api_key || undefined

  // Prepare document buffer
  let fileBuffer: Buffer | null = null
  let fileName = job.document_name || 'document.pdf'

  if (job.template_id) {
    // Load template and fill with docxtemplater
    const { data: template } = await supabaseAdmin
      .from('signing_templates')
      .select('*')
      .eq('id', job.template_id)
      .single()

    if (!template || !template.file_path) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const { data: fileData, error: dlError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(template.file_path)

    if (dlError || !fileData) {
      return NextResponse.json({ error: 'Failed to download template file' }, { status: 500 })
    }

    const templateBuffer = Buffer.from(await fileData.arrayBuffer())
    const templateData = body.templateData || {}

    try {
      const PizZip = (await import('pizzip')).default
      const Docxtemplater = (await import('docxtemplater')).default
      const zip = new PizZip(templateBuffer)
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
      doc.setData(templateData)
      doc.render()
      fileBuffer = doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
      fileName = `${template.name || 'document'}.docx`
    } catch (templateError) {
      console.error('[Signing PATCH] Template processing error:', templateError)
      return NextResponse.json({ error: 'Failed to process template' }, { status: 500 })
    }
  } else if (body.file) {
    // Decode base64 file
    fileBuffer = Buffer.from(body.file, 'base64')
  }

  // Map signers to Signi format
  const signiSigners: SigniSignerInput[] = signers.map((s: any, i: number) => ({
    name: s.name,
    email: s.email,
    phone: s.phone || undefined,
    contract_role: mapSignerRole(s.role || 'sign', job.signature_type || 'electronic'),
    order: i + 1,
  }))

  // Mock mode or real API
  if (!apiKey) {
    // Mock mode — no API key configured
    const mockContractId = `mock-${Date.now()}`

    await supabaseAdmin
      .from('signing_jobs')
      .update({
        signi_contract_id: mockContractId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // Update signers with mock IDs
    for (const signer of signers) {
      await supabaseAdmin
        .from('signing_signers')
        .update({ signi_signer_id: `mock-signer-${signer.id}` })
        .eq('id', signer.id)
    }

    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: job.id,
      event_type: 'sent',
      actor: userId,
      description: 'Job sent in mock mode (no API key configured)',
      metadata: { mock: true, signi_contract_id: mockContractId },
    })

    return NextResponse.json({
      job: { ...job, signi_contract_id: mockContractId, status: 'pending' },
      mock: true,
    })
  }

  // Real Signi API call
  if (!fileBuffer) {
    return NextResponse.json({ error: 'No file provided and no template configured' }, { status: 400 })
  }

  try {
    const contract = await createContract(fileBuffer, fileName, job.document_name, signiSigners, {
      note: job.note || undefined,
      apiKey,
    })

    // Update job with Signi contract ID
    await supabaseAdmin
      .from('signing_jobs')
      .update({
        signi_contract_id: contract.contract_id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // Update signers with Signi signer IDs
    if (Array.isArray(contract.sign_identities)) {
      for (let i = 0; i < contract.sign_identities.length && i < signers.length; i++) {
        await supabaseAdmin
          .from('signing_signers')
          .update({ signi_signer_id: contract.sign_identities[i].id })
          .eq('id', signers[i].id)
      }
    }

    // Log event
    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: job.id,
      event_type: 'sent',
      actor: userId,
      description: `Job sent to Signi (contract: ${contract.contract_id})`,
      metadata: { signi_contract_id: contract.contract_id },
    })

    return NextResponse.json({
      job: { ...job, signi_contract_id: contract.contract_id, status: 'pending' },
    })
  } catch (signiError) {
    console.error('[Signing PATCH] Signi API error:', signiError)
    const message = signiError instanceof Error ? signiError.message : 'Signi API error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

async function handleCancel(job: any, userId: string): Promise<NextResponse> {
  if (job.status !== 'draft' && job.status !== 'pending') {
    return NextResponse.json({ error: 'Only draft or pending jobs can be cancelled' }, { status: 400 })
  }

  // If sent to Signi, cancel there too
  if (job.signi_contract_id && !job.signi_contract_id.startsWith('mock-')) {
    try {
      // Get user's API key for the cancel call
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('signi_api_key')
        .eq('id', userId)
        .single()

      await cancelContract(job.signi_contract_id, user?.signi_api_key || undefined)
    } catch (cancelError) {
      console.error('[Signing PATCH] Signi cancel error:', cancelError)
      // Continue with local cancellation even if Signi fails
    }
  }

  await supabaseAdmin
    .from('signing_jobs')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  await supabaseAdmin.from('signing_events').insert({
    signing_job_id: job.id,
    event_type: 'cancelled',
    actor: userId,
    description: 'Job cancelled by user',
    metadata: {},
  })

  return NextResponse.json({ job: { ...job, status: 'cancelled' } })
}

/**
 * DELETE /api/accountant/signing/[jobId]
 * Delete a draft signing job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { jobId } = await params

    // Load job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('signing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Signing job not found' }, { status: 404 })
    }

    // Ownership check
    if (job.created_by !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (job.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft jobs can be deleted' }, { status: 400 })
    }

    // Delete job (CASCADE will handle signers and events)
    const { error: deleteError } = await supabaseAdmin
      .from('signing_jobs')
      .delete()
      .eq('id', job.id)

    if (deleteError) {
      console.error('[Signing DELETE] Error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete signing job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Signing DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
