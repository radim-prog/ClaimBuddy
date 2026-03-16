import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole, canAccessCompany } from '@/lib/access-check'
import { createContract } from '@/lib/signi-client'
import { decrypt, isEncrypted } from '@/lib/crypto'
import type { SigniSignerInput } from '@/lib/types/signing'
import { signingCreateSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * POST /api/signing/create
 * Create a new signing job and optionally send to Signi
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = signingCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const { companyId, documentName, documentType, signatureType, templateId, signers, fileBase64, fileName, note } = parsed.data

    // IDOR check
    const impersonate = request.headers.get('x-impersonate-company')
    const hasAccess = await canAccessCompany(userId, userRole, companyId, impersonate)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's Signi API key
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('signi_api_key')
      .eq('id', userId)
      .single()

    let apiKey = process.env.SIGNI_API_KEY || ''
    if (user?.signi_api_key) {
      try {
        apiKey = isEncrypted(user.signi_api_key) ? decrypt(user.signi_api_key) : user.signi_api_key
      } catch {
        apiKey = user.signi_api_key
      }
    }

    // Create signing job in DB
    const { data: job, error: jobError } = await supabaseAdmin
      .from('signing_jobs')
      .insert({
        company_id: companyId,
        template_id: templateId || null,
        created_by: userId,
        document_name: documentName,
        document_type: documentType || 'contract',
        signature_type: signatureType || 'simple',
        status: 'draft',
        note: note || null,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('[Signing] Job create error:', jobError)
      return NextResponse.json({ error: 'Failed to create signing job' }, { status: 500 })
    }

    // Insert signers
    const signerRows = signers.map((s, i) => ({
      signing_job_id: job.id,
      name: s.name,
      email: s.email,
      phone: s.phone || null,
      role: s.role || 'sign',
      order_index: s.order ?? i,
      status: 'waiting',
    }))

    await supabaseAdmin.from('signing_signers').insert(signerRows)

    // Log creation event
    await supabaseAdmin.from('signing_events').insert({
      signing_job_id: job.id,
      event_type: 'created',
      actor: userId,
      description: `Podpisový úkol "${documentName}" vytvořen`,
      metadata: { document_type: documentType, signers_count: signers.length },
    })

    // If file provided, send to Signi immediately
    if (fileBase64 && fileName) {
      const fileBuffer = Buffer.from(fileBase64, 'base64')
      const signiSigners: SigniSignerInput[] = signers.map((s, i) => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        contract_role: (s.role || 'sign') as SigniSignerInput['contract_role'],
        order: s.order ?? i,
      }))

      try {
        const contract = await createContract(fileBuffer, fileName, documentName, signiSigners, {
          note: note ?? undefined,
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

        // Log sent event
        await supabaseAdmin.from('signing_events').insert({
          signing_job_id: job.id,
          event_type: 'sent',
          actor: userId,
          description: 'Dokument odeslán k podpisu přes Signi',
          metadata: { signi_contract_id: contract.contract_id },
        })

        return NextResponse.json({
          success: true,
          job: { ...job, status: 'pending', signi_contract_id: contract.contract_id },
        })
      } catch (signiError) {
        console.error('[Signing] Signi API error:', signiError)
        return NextResponse.json({
          success: true,
          job,
          warning: 'Job created but Signi upload failed. Retry from the signing page.',
        })
      }
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('[Signing] Create error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create signing job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
