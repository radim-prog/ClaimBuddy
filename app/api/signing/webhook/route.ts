export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { SigniWebhookPayload } from '@/lib/types/signing'

/**
 * POST /api/signing/webhook
 * Public endpoint — receives POST callbacks from Signi.com
 * Always returns 200 OK (webhook best practice)
 */
export async function POST(request: NextRequest) {
  try {
    const payload: SigniWebhookPayload = await request.json()
    const { state, contract_id, message, file } = payload

    if (!contract_id || !state) {
      console.warn('[Signing Webhook] Missing contract_id or state in payload')
      return NextResponse.json({ status: 'ok' })
    }

    // Find the signing job by Signi contract ID
    const { data: job, error: jobError } = await supabaseAdmin
      .from('signing_jobs')
      .select('*')
      .eq('signi_contract_id', contract_id)
      .single()

    if (jobError || !job) {
      console.error('[Signing Webhook] Job not found for contract_id:', contract_id)
      return NextResponse.json({ status: 'ok' })
    }

    // Map Signi state to our status
    const statusMap: Record<string, string> = {
      signed: 'signed',
      rejected: 'rejected',
      expired: 'expired',
    }
    const newStatus = statusMap[state]
    if (!newStatus) {
      console.warn('[Signing Webhook] Unknown state:', state)
      return NextResponse.json({ status: 'ok' })
    }

    // Update job status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (state === 'signed') {
      updateData.signed_at = new Date().toISOString()
    }

    // If signed and file URL provided, download and store the signed PDF
    // The URL expires in ~10 minutes, so fetch immediately
    if (state === 'signed' && file) {
      try {
        const fileRes = await fetch(file)
        if (fileRes.ok) {
          const pdfBuffer = Buffer.from(await fileRes.arrayBuffer())
          const storagePath = `signed-documents/${job.id}.pdf`

          const { error: uploadError } = await supabaseAdmin
            .storage
            .from('documents')
            .upload(storagePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            })

          if (!uploadError) {
            updateData.signed_document_path = storagePath
          } else {
            console.error('[Signing Webhook] Failed to upload signed PDF:', uploadError)
          }
        } else {
          console.error('[Signing Webhook] Failed to fetch signed PDF:', fileRes.status)
        }
      } catch (fetchError) {
        console.error('[Signing Webhook] Error fetching signed PDF:', fetchError)
      }
    }

    await supabaseAdmin
      .from('signing_jobs')
      .update(updateData)
      .eq('id', job.id)

    // Update signers: change all 'waiting' to new status
    const signerUpdate: Record<string, unknown> = { status: newStatus }
    if (state === 'signed') {
      signerUpdate.signed_at = new Date().toISOString()
    }
    if (state === 'rejected' && message) {
      signerUpdate.rejected_reason = message
    }

    await supabaseAdmin
      .from('signing_signers')
      .update(signerUpdate)
      .eq('signing_job_id', job.id)
      .eq('status', 'waiting')

    // Log event
    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: job.id,
      event_type: state,
      actor: 'signi-webhook',
      description: `Contract ${state}${message ? `: ${message}` : ''}`,
      metadata: { contract_id, message, file_url: file },
    })

    // Create in-app notification for the accountant (best effort)
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: job.created_by,
        type: state === 'signed' ? 'signing_completed' : 'signing_' + state,
        title: state === 'signed'
          ? `Dokument "${job.document_name}" podepsán`
          : `Dokument "${job.document_name}" — ${state}`,
        message: state === 'signed'
          ? 'Všechny strany podepsaly dokument.'
          : (message || `Stav: ${state}`),
        metadata: { signing_job_id: job.id, signi_contract_id: contract_id },
      })
    } catch {
      // Best effort — don't fail webhook if notification insert fails
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[Signing Webhook] Error:', error)
    // Always return 200 for webhooks
    return NextResponse.json({ status: 'ok' })
  }
}
