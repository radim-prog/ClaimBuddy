import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getSession } from '@/lib/travel-generation-store'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

// GET: Generated trips for this session
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

    const { data: trips, error } = await supabaseAdmin
      .from('travel_trips')
      .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
      .eq('generation_session_id', params.sessionId)
      .order('generation_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      trips: trips || [],
      total: (trips || []).length,
      session_status: session.status,
      validation_score: session.validation_score,
      validation_issues: session.validation_issues,
    })
  } catch (error) {
    console.error('Get generated trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Edit a single trip by index or ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmIdPatch = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmIdPatch)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const session = await getSession(params.sessionId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
    }

    const body = await request.json()
    const { trip_id, trip_index, updates } = body as {
      trip_id?: string
      trip_index?: number
      updates: Record<string, unknown>
    }

    if (!updates || (!trip_id && trip_index === undefined)) {
      return NextResponse.json({ error: 'trip_id or trip_index + updates required' }, { status: 400 })
    }

    // Allowed editable fields
    const ALLOWED = [
      'trip_date', 'departure_time', 'arrival_time', 'origin', 'destination',
      'purpose', 'distance_km', 'is_round_trip', 'route_description',
      'odometer_start', 'odometer_end', 'notes',
    ]
    const safeUpdates: Record<string, unknown> = { manual_override: true }
    for (const key of ALLOWED) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key]
    }

    let query = supabaseAdmin
      .from('travel_trips')
      .update(safeUpdates)
      .eq('generation_session_id', params.sessionId)

    if (trip_id) {
      query = query.eq('id', trip_id)
    } else {
      query = query.eq('generation_order', trip_index!)
    }

    const { data, error } = await query.select('*').single()
    if (error) throw error

    return NextResponse.json({ trip: data })
  } catch (error) {
    console.error('Edit trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
