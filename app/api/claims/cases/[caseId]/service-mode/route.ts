import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const VALID_MODES = ['self_service', 'ai_processing', 'consultation', 'full_representation'] as const

// PATCH /api/claims/cases/[caseId]/service-mode — set service mode (public, no auth required)
// Called from choose-service page before/after payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  try {
    const body = await request.json()
    const { service_mode } = body

    if (!service_mode || !VALID_MODES.includes(service_mode)) {
      return NextResponse.json(
        { error: `service_mode must be one of: ${VALID_MODES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify case exists
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('insurance_cases')
      .select('id')
      .eq('id', caseId)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const { error: updateErr } = await supabaseAdmin
      .from('insurance_cases')
      .update({
        service_mode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Claims service-mode] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
