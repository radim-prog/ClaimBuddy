import { NextRequest, NextResponse } from 'next/server'
import { getTrips, getVehicles } from '@/lib/travel-store-db'
import type { TravelTrip } from '@/lib/types/travel'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const format = searchParams.get('format') || 'csv'

    const trips = await getTrips({ companyId: params.companyId, month })

    if (format === 'csv') {
      const csv = generateCSV(trips)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kniha-jizd-${month || 'vse'}.csv"`,
        },
      })
    }

    // JSON fallback
    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Accountant travel export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCSV(trips: TravelTrip[]): string {
  const BOM = '\uFEFF'
  const header = 'Datum;Odkud;Kam;Ucel;Typ;Km;SPZ;Ridic;Tachometr start;Tachometr konec;Sazba Kc/km;Nahrada Kc;Poznamka'
  const rows = trips.map(t => [
    t.trip_date,
    `"${(t.origin || '').replace(/"/g, '""')}"`,
    `"${(t.destination || '').replace(/"/g, '""')}"`,
    `"${(t.purpose || '').replace(/"/g, '""')}"`,
    t.trip_type,
    t.distance_km,
    t.vehicle_license_plate || '',
    t.driver_name || '',
    t.odometer_start || '',
    t.odometer_end || '',
    t.rate_per_km || '',
    t.reimbursement || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ].join(';'))

  return BOM + [header, ...rows].join('\n')
}
