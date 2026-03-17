import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { TravelBookDocument, type TravelBookData } from '@/lib/pdf/travel-book-template'

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

// GET: Export client's travel book as PDF or CSV
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
  if (companyIds.length === 0) {
    return NextResponse.json({ error: 'No company found' }, { status: 400 })
  }
  const companyId = companyIds[0]

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'pdf'
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined

  // Build date range
  let dateStart: string
  let dateEnd: string
  let periodLabel: string

  if (month) {
    dateStart = `${year}-${String(month).padStart(2, '0')}-01`
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
    dateEnd = nextMonth
    periodLabel = `${year}-${String(month).padStart(2, '0')}`
  } else {
    dateStart = `${year}-01-01`
    dateEnd = `${year + 1}-01-01`
    periodLabel = `${year}`
  }

  try {
    // Fetch trips with joins
    const { data: trips, error: tripsErr } = await supabaseAdmin
      .from('travel_trips')
      .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
      .eq('company_id', companyId)
      .gte('trip_date', dateStart)
      .lt('trip_date', dateEnd)
      .order('trip_date', { ascending: true })
      .order('departure_time', { ascending: true, nullsFirst: true })

    if (tripsErr) throw tripsErr
    if (!trips || trips.length === 0) {
      return NextResponse.json({ error: 'No trips to export' }, { status: 404 })
    }

    // Fetch company info
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, ico, address_street, address_city')
      .eq('id', companyId)
      .single()

    if (format === 'csv') {
      const csv = generateCSV(trips)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kniha-jizd-${periodLabel}.csv"`,
        },
      })
    }

    // PDF
    const vehicle = trips[0].travel_vehicles
    const driver = trips[0].travel_drivers
    const totalKm = trips.reduce((s: number, t: any) => s + (t.distance_km || 0), 0)
    const totalReimbursement = trips.reduce((s: number, t: any) => s + (t.reimbursement || 0), 0)

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
      period_start: month ? periodLabel : `${year}-01`,
      period_end: month ? periodLabel : `${year}-12`,
      trips: trips.map((t: any) => ({
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
      total_km: totalKm,
      total_reimbursement: totalReimbursement,
      generated_at: new Date().toISOString(),
    }

    const buffer = await renderToBuffer(
      TravelBookDocument({ data: pdfData }) as any
    )

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kniha-jizd-${periodLabel}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Client travel export error:', error)
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
