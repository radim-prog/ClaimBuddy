import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getSession } from '@/lib/travel-generation-store'
import { runPipeline } from '@/lib/travel-generator-opus'
import { checkTravelCredits, consumeTravelCredits, TRAVEL_CREDIT_COSTS, type TravelCreditType } from '@/lib/plan-gate'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 600 // 10 minutes for long pipeline

// POST: Start AI generation pipeline (async, returns 202)
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const session = await getSession(params.sessionId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
    }

    // Check if already running or completed
    if (session.status === 'generating') {
      return NextResponse.json({ error: 'Pipeline already running' }, { status: 409 })
    }
    if (session.status === 'generated' || session.status === 'reviewed' || session.status === 'exported') {
      const body = await request.json().catch(() => ({}))
      if (!(body as { force_regenerate?: boolean }).force_regenerate) {
        return NextResponse.json({ error: 'Already generated. Use force_regenerate=true to regenerate.' }, { status: 409 })
      }
    }

    // Determine credit type: regen if already generated, fleet vs single based on vehicle count
    const isRegen = session.status === 'generated' || session.status === 'reviewed' || session.status === 'exported'
    let creditType: TravelCreditType = 'yearly_single'
    if (isRegen) {
      creditType = 'regen'
    } else {
      // Check vehicle count from odometer readings in this session
      const { count: vehicleCount } = await supabaseAdmin
        .from('travel_generation_odometer')
        .select('vehicle_id', { count: 'exact', head: true })
        .eq('session_id', params.sessionId)
      creditType = (vehicleCount ?? 1) > 1 ? 'yearly_fleet' : 'yearly_single'
    }

    // Credit check BEFORE generating (402 if insufficient)
    const creditCheck = await checkTravelCredits(userId, creditType)
    if (!creditCheck.allowed) {
      return NextResponse.json({
        error: creditCheck.reason,
        required: creditCheck.required,
        available: creditCheck.available,
      }, { status: 402 })
    }

    // Consume credits upfront
    const creditCost = TRAVEL_CREDIT_COSTS[creditType]
    const consumed = await consumeTravelCredits(userId, creditCost)
    if (!consumed) {
      return NextResponse.json({
        error: 'Nepodařilo se odečíst kredity. Zkuste to znovu.',
      }, { status: 402 })
    }

    // Fire and forget — pipeline runs async
    // We don't await the pipeline so the response returns immediately
    runPipeline(params.sessionId).catch(err => {
      console.error('Pipeline background error:', err)
    })

    return NextResponse.json(
      { message: 'Pipeline started', session_id: params.sessionId, credits_consumed: creditCost },
      { status: 202 }
    )
  } catch (error) {
    console.error('Run pipeline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
