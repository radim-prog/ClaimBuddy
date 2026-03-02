import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTrips, createTrip } from '@/lib/travel-store-db'

export const dynamic = 'force-dynamic'

async function getCompanyIds(userId: string, impersonateCompany: string | null): Promise<string[]> {
  if (impersonateCompany) return [impersonateCompany]
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
  return (data ?? []).map(c => c.id)
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ trips: [] })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const vehicleId = searchParams.get('vehicleId') || undefined
    const tripType = searchParams.get('tripType') || undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined

    const trips = await getTrips({
      companyId: companyIds[0],
      month,
      vehicleId,
      tripType,
      limit,
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Client travel trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const body = await request.json()
    const trip = await createTrip({
      company_id: companyIds[0],
      vehicle_id: body.vehicle_id || null,
      driver_id: body.driver_id || null,
      trip_date: body.trip_date,
      departure_time: body.departure_time || null,
      arrival_time: body.arrival_time || null,
      origin: body.origin,
      destination: body.destination,
      route_description: body.route_description || null,
      purpose: body.purpose,
      trip_type: body.trip_type || 'business',
      distance_km: body.distance_km,
      odometer_start: body.odometer_start ?? null,
      odometer_end: body.odometer_end ?? null,
      is_round_trip: body.is_round_trip || false,
      fuel_consumed: body.fuel_consumed ?? null,
      fuel_cost: body.fuel_cost ?? null,
      rate_per_km: body.rate_per_km ?? null,
      reimbursement: body.reimbursement ?? null,
      manual_override: body.manual_override || false,
      document_ids: body.document_ids || null,
      notes: body.notes || null,
    })

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error('Client create trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
