import { NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { processClaimWithAI } from '@/lib/claims-ai-processor'

/**
 * POST /api/claims/ai-process
 * Body: { case_id: string }
 *
 * Triggers AI analysis of a claim. Requires:
 *   - Staff role (admin/accountant) OR
 *   - Case has service_mode = 'ai_processing' with payment_status = 'paid'
 */
export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { case_id } = await request.json()

    if (!case_id) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    // Fetch case to verify permissions
    const { data: caseData, error: caseErr } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, service_mode, payment_status, ai_processed_at')
      .eq('id', case_id)
      .single()

    if (caseErr || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Staff can always trigger AI processing
    const isStaff = isStaffRole(userRole)

    if (!isStaff) {
      // Client must have ai_processing mode with paid status
      if (caseData.service_mode !== 'ai_processing') {
        return NextResponse.json(
          { error: 'AI zpracování není aktivní pro tuto událost. Zvolte tarif AI zpracování.' },
          { status: 403 },
        )
      }
      if (caseData.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Platba za AI zpracování nebyla přijata.' },
          { status: 402 },
        )
      }
    }

    // Prevent re-processing if already done (staff can override)
    if (caseData.ai_processed_at && !isStaff) {
      return NextResponse.json(
        { error: 'AI zpráva již byla vygenerována.' },
        { status: 409 },
      )
    }

    // Run AI processing
    const report = await processClaimWithAI(case_id)

    return NextResponse.json({
      success: true,
      report,
      processed_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('AI processing error:', err)
    const message = err instanceof Error ? err.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
