import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getVehicles, createVehicle } from '@/lib/travel-store-db'

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
    if (companyIds.length === 0) return NextResponse.json({ vehicles: [] })

    const vehicles = await getVehicles(companyIds[0])
    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Client vehicles error:', error)
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
    const vehicle = await createVehicle({
      company_id: companyIds[0],
      name: body.name,
      license_plate: body.license_plate,
      brand: body.brand || null,
      model: body.model || null,
      year: body.year || null,
      vin: body.vin || null,
      fuel_type: body.fuel_type || 'petrol',
      fuel_consumption: body.fuel_consumption ?? null,
      tank_capacity: body.tank_capacity ?? null,
      current_fuel_level: body.current_fuel_level ?? null,
      current_odometer: body.current_odometer || 0,
      vehicle_category: body.vehicle_category || 'car',
      rate_per_km: body.rate_per_km ?? 5.90,
      is_company_car: body.is_company_car ?? true,
      is_active: true,
    })

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error) {
    console.error('Create vehicle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
