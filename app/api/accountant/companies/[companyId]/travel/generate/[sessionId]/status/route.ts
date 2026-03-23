import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getSession } from '@/lib/travel-generation-store'
import { getProgress } from '@/lib/travel-generator-opus'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

// GET: Pipeline progress (%, current step)
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const session = await getSession(params.sessionId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
    }

    // Check in-memory progress first (live updates during pipeline)
    const progress = getProgress(params.sessionId)

    if (progress) {
      return NextResponse.json({
        status: session.status,
        progress,
      })
    }

    // No in-memory progress — derive from session status
    const statusMap: Record<string, { step: string; pct: number; message: string }> = {
      draft: { step: 'waiting', pct: 0, message: 'Session pripravena, ceka na spusteni' },
      documents_selected: { step: 'waiting', pct: 0, message: 'Doklady vybrane, ceka na spusteni' },
      fuel_verified: { step: 'waiting', pct: 0, message: 'PHM overeno, ceka na spusteni' },
      vehicles_configured: { step: 'waiting', pct: 0, message: 'Vozidla nakonfigurovana, ceka na spusteni' },
      generating: { step: 'generating', pct: 50, message: 'Generovani probiha...' },
      generated: { step: 'done', pct: 100, message: `Hotovo — ${session.total_trips} cest, ${session.total_km} km` },
      reviewed: { step: 'done', pct: 100, message: 'Zkontrolovano' },
      exported: { step: 'done', pct: 100, message: 'Exportovano' },
      failed: { step: 'failed', pct: 0, message: 'Generování se nezdařilo' },
    }

    const derived = statusMap[session.status] || { step: 'unknown', pct: 0, message: session.status }

    return NextResponse.json({
      status: session.status,
      progress: derived,
      ai_stats: session.status === 'generated' || session.status === 'reviewed' || session.status === 'exported'
        ? {
            calls: session.ai_calls_count,
            tokens_input: session.ai_tokens_input,
            tokens_output: session.ai_tokens_output,
            cost_czk: session.ai_total_cost_czk,
            validation_score: session.validation_score,
          }
        : null,
    })
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
