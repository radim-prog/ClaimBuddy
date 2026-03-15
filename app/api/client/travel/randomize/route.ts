import { NextRequest, NextResponse } from 'next/server'
import { generateTrips, prepareTripsForSave } from '@/lib/travel-randomizer'
import { getVehicles, getPlaces, getTrips, getFuelLogs, createTrip } from '@/lib/travel-store-db'
import { checkFeatureAccess, logGatedAction } from '@/lib/plan-gate'
import { consumeCredit } from '@/lib/subscription-store'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function resolveCompanyId(userId: string, requestedCompanyId?: string, impersonateCompany?: string | null): Promise<string | null> {
  if (requestedCompanyId) return requestedCompanyId
  if (impersonateCompany) return impersonateCompany
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .limit(1)
  return data?.[0]?.id || null
}

// POST: Generate AI trips from fuel logs
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Plan gate: travel_randomizer feature (Premium client only)
  const gate = await checkFeatureAccess(userId, 'travel_randomizer', 'client')
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 403 })
  }

  const body = await request.json()
  const { companyId: requestedCompanyId, vehicleId, year, month, targetKm, driverId, autoSave } = body as {
    companyId?: string
    vehicleId: string
    year: number
    month: number
    targetKm?: number
    driverId?: string
    autoSave?: boolean
  }

  const companyId = await resolveCompanyId(userId, requestedCompanyId, request.headers.get('x-impersonate-company'))
  if (!companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 400 })
  }

  // IDOR check: verify user owns the company
  if (requestedCompanyId) {
    const { data: owned } = await supabase
      .from('companies')
      .select('id')
      .eq('id', requestedCompanyId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single()
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!vehicleId || !year || !month) {
    return NextResponse.json({ error: 'Missing required fields (vehicleId, year, month)' }, { status: 400 })
  }

  try {
    // Load context data
    const [vehicles, places, existingTrips, fuelLogs] = await Promise.all([
      getVehicles(companyId),
      getPlaces(companyId),
      getTrips({ companyId, month: `${year}-${String(month).padStart(2, '0')}` }),
      getFuelLogs(companyId, vehicleId),
    ])

    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Filter fuel logs to the requested period
    const periodPrefix = `${year}-${String(month).padStart(2, '0')}`
    const periodFuelLogs = fuelLogs.filter(l => l.log_date.startsWith(periodPrefix))

    if (periodFuelLogs.length === 0 && !targetKm) {
      return NextResponse.json({
        error: 'Žádné záznamy tankování v tomto období. Zadejte cílový počet km ručně.',
      }, { status: 400 })
    }

    // Get company info for context
    const { data: company } = await supabase
      .from('companies')
      .select('name, address')
      .eq('id', companyId)
      .single()

    // Generate trips via AI
    const result = await generateTrips({
      vehicle,
      fuelLogs: periodFuelLogs,
      existingPlaces: places,
      existingTrips,
      companyName: company?.name || 'Firma',
      companyAddress: company?.address || null,
      period: { year, month },
      targetKm,
    })

    // Log usage
    await logGatedAction(userId, 'travel_randomizer_used', companyId)

    // Consume credit
    const currentPeriod = new Date().toISOString().slice(0, 7)
    await consumeCredit(userId, 'extraction', currentPeriod)

    // Auto-save if requested
    const savedTrips: string[] = []
    if (autoSave && result.trips.length > 0) {
      const prepared = prepareTripsForSave(result.trips, vehicle, companyId, driverId || null)
      for (const trip of prepared) {
        const saved = await createTrip(trip as Parameters<typeof createTrip>[0])
        savedTrips.push(saved.id)
      }
    }

    return NextResponse.json({
      success: true,
      trips: result.trips,
      totalKm: result.totalKm,
      estimatedFromFuel: result.estimatedFromFuel,
      tokensUsed: result.tokensUsed,
      savedTripIds: savedTrips.length > 0 ? savedTrips : undefined,
    })
  } catch (error) {
    console.error('[Travel Randomizer] Error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
