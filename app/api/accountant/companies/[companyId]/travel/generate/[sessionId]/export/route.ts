import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getSession, updateSession } from '@/lib/travel-generation-store'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { TravelBookDocument, type TravelBookData } from '@/lib/pdf/travel-book-template'

export const dynamic = 'force-dynamic'

// GET: Export generated trips as PDF or CSV
export async function GET(
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

    if (!['generated', 'reviewed', 'exported'].includes(session.status)) {
      return NextResponse.json({ error: 'Session not yet generated' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    // Fetch trips
    const { data: trips, error: tripsErr } = await supabaseAdmin
      .from('travel_trips')
      .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
      .eq('generation_session_id', params.sessionId)
      .order('generation_order', { ascending: true })

    if (tripsErr) throw tripsErr
    if (!trips || trips.length === 0) {
      return NextResponse.json({ error: 'No trips to export' }, { status: 404 })
    }

    // Fetch company info
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, ico, address_street, address_city')
      .eq('id', params.companyId)
      .single()

    // Primary vehicle from first trip
    const vehicle = trips[0].travel_vehicles
    const driver = trips[0].travel_drivers

    if (format === 'csv') {
      const csv = generateCSV(trips)
      // Mark as exported
      await updateSession(params.sessionId, { status: 'exported', exported_at: new Date().toISOString() })
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kniha-jizd-${session.period_start}-${session.period_end}.csv"`,
        },
      })
    }

    // PDF
    const pdfData: TravelBookData = {
      company_name: company?.name || 'Firma',
      company_ico: company?.ico || null,
      company_address: [company?.address_street, company?.address_city].filter(Boolean).join(', ') || null,
      vehicle_name: vehicle?.name || 'Vozidlo',
      vehicle_license_plate: vehicle?.license_plate || '???',
      vehicle_category: vehicle?.vehicle_category || 'car',
      vehicle_fuel_type: vehicle?.fuel_type || 'petrol',
      vehicle_fuel_consumption: vehicle?.fuel_consumption ? Number(vehicle.fuel_consumption) : null,
      driver_name: driver?.name || null,
      period_start: session.period_start,
      period_end: session.period_end,
      trips: trips.map(t => ({
        trip_date: t.trip_date,
        departure_time: t.departure_time,
        arrival_time: t.arrival_time,
        origin: t.origin,
        destination: t.destination,
        purpose: t.purpose,
        distance_km: t.distance_km,
        is_round_trip: t.is_round_trip,
        odometer_start: t.odometer_start,
        odometer_end: t.odometer_end,
        basic_rate_per_km: t.basic_rate_per_km,
        fuel_price_per_unit: t.fuel_price_per_unit,
        reimbursement: t.reimbursement,
      })),
      total_km: session.total_km,
      total_reimbursement: session.total_reimbursement,
      generated_at: session.generated_at || new Date().toISOString(),
    }

    const buffer = await renderToBuffer(
      TravelBookDocument({ data: pdfData }) as any
    )

    // Mark as exported
    await updateSession(params.sessionId, { status: 'exported', exported_at: new Date().toISOString() })

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kniha-jizd-${session.period_start}-${session.period_end}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCSV(trips: Array<Record<string, unknown>>): string {
  const BOM = '\uFEFF'
  const header = 'Datum;Odkud;Kam;Ucel;Km;Zpet;Tachometr start;Tachometr konec;Sazba Kc/km;Cena PHM;Nahrada Kc;SPZ;Ridic;Poznamka'
  const rows = trips.map(t => [
    t.trip_date,
    `"${String(t.origin || '').replace(/"/g, '""')}"`,
    `"${String(t.destination || '').replace(/"/g, '""')}"`,
    `"${String(t.purpose || '').replace(/"/g, '""')}"`,
    t.distance_km,
    t.is_round_trip ? 'Ano' : 'Ne',
    t.odometer_start || '',
    t.odometer_end || '',
    t.basic_rate_per_km || '',
    t.fuel_price_per_unit || '',
    t.reimbursement || '',
    (t.travel_vehicles as Record<string, unknown>)?.license_plate || '',
    (t.travel_drivers as Record<string, unknown>)?.name || '',
    `"${String(t.notes || '').replace(/"/g, '""')}"`,
  ].join(';'))

  return BOM + [header, ...rows].join('\n')
}
