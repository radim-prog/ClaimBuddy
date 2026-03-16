import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getSession, updateSession } from '@/lib/travel-generation-store'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST: Commit generated trips — mark session as reviewed, finalize trips
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

    if (session.status !== 'generated' && session.status !== 'reviewed') {
      return NextResponse.json({ error: 'Session must be generated or reviewed to commit' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { driver_id } = body as { driver_id?: string }

    // Optionally assign driver to all trips
    if (driver_id) {
      const { error: driverErr } = await supabaseAdmin
        .from('travel_trips')
        .update({ driver_id })
        .eq('generation_session_id', params.sessionId)

      if (driverErr) throw driverErr
    }

    // Count final trips + stats
    const { data: trips, error: tripsErr } = await supabaseAdmin
      .from('travel_trips')
      .select('distance_km, odometer_start, odometer_end, is_round_trip, reimbursement')
      .eq('generation_session_id', params.sessionId)

    if (tripsErr) throw tripsErr

    const totalTrips = (trips || []).length
    const totalKm = (trips || []).reduce((s, t) => {
      return s + ((t.odometer_end || 0) - (t.odometer_start || 0))
    }, 0)
    const totalReimbursement = (trips || []).reduce((s, t) => s + (t.reimbursement || 0), 0)

    // Update session as reviewed
    await updateSession(params.sessionId, {
      status: 'reviewed',
      total_trips: totalTrips,
      total_km: totalKm,
      total_reimbursement: Math.round(totalReimbursement * 100) / 100,
    })

    return NextResponse.json({
      committed: true,
      total_trips: totalTrips,
      total_km: totalKm,
      total_reimbursement: Math.round(totalReimbursement * 100) / 100,
    })
  } catch (error) {
    console.error('Commit trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
