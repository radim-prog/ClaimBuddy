import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFuelLogs, createFuelLog } from '@/lib/travel-store-db'

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
    if (companyIds.length === 0) return NextResponse.json({ fuelLogs: [] })

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId') || undefined

    const fuelLogs = await getFuelLogs(companyIds[0], vehicleId)
    return NextResponse.json({ fuelLogs })
  } catch (error) {
    console.error('Client fuel logs error:', error)
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
    const fuelLog = await createFuelLog({
      company_id: companyIds[0],
      vehicle_id: body.vehicle_id,
      log_date: body.log_date,
      liters: body.liters,
      price_per_liter: body.price_per_liter ?? null,
      total_price: body.total_price ?? null,
      odometer: body.odometer ?? null,
      station_name: body.station_name || null,
      is_full_tank: body.is_full_tank || false,
      document_id: body.document_id || null,
    })

    return NextResponse.json({ fuelLog }, { status: 201 })
  } catch (error) {
    console.error('Create fuel log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
