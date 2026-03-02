import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  TravelVehicle,
  TravelDriver,
  TravelPlace,
  TravelTrip,
  TravelFuelLog,
  TravelStats,
} from '@/lib/types/travel'

// ============================================
// VEHICLES
// ============================================

function mapVehicle(row: any): TravelVehicle {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    license_plate: row.license_plate,
    brand: row.brand,
    model: row.model,
    year: row.year,
    vin: row.vin,
    fuel_type: row.fuel_type || 'petrol',
    fuel_consumption: row.fuel_consumption ? Number(row.fuel_consumption) : null,
    tank_capacity: row.tank_capacity ? Number(row.tank_capacity) : null,
    current_fuel_level: row.current_fuel_level ? Number(row.current_fuel_level) : null,
    current_odometer: row.current_odometer || 0,
    vehicle_category: row.vehicle_category || 'car',
    rate_per_km: Number(row.rate_per_km) || 5.90,
    is_company_car: row.is_company_car ?? true,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getVehicles(companyId: string): Promise<TravelVehicle[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_vehicles')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`Failed to fetch vehicles: ${error.message}`)
  return (data ?? []).map(mapVehicle)
}

export async function createVehicle(vehicle: Omit<TravelVehicle, 'id' | 'created_at' | 'updated_at'>): Promise<TravelVehicle> {
  const { data, error } = await supabaseAdmin
    .from('travel_vehicles')
    .insert(vehicle)
    .select()
    .single()

  if (error) throw new Error(`Failed to create vehicle: ${error.message}`)
  return mapVehicle(data)
}

export async function updateVehicle(id: string, companyId: string, updates: Partial<TravelVehicle>): Promise<TravelVehicle> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safeUpdates } = updates as any
  const { data, error } = await supabaseAdmin
    .from('travel_vehicles')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update vehicle: ${error.message}`)
  return mapVehicle(data)
}

export async function deleteVehicle(id: string, companyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('travel_vehicles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw new Error(`Failed to delete vehicle: ${error.message}`)
}

// ============================================
// DRIVERS
// ============================================

function mapDriver(row: any): TravelDriver {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    license_number: row.license_number,
    is_default: row.is_default ?? false,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  }
}

export async function getDrivers(companyId: string): Promise<TravelDriver[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_drivers')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw new Error(`Failed to fetch drivers: ${error.message}`)
  return (data ?? []).map(mapDriver)
}

export async function createDriver(driver: Omit<TravelDriver, 'id' | 'created_at'>): Promise<TravelDriver> {
  const { data, error } = await supabaseAdmin
    .from('travel_drivers')
    .insert(driver)
    .select()
    .single()

  if (error) throw new Error(`Failed to create driver: ${error.message}`)
  return mapDriver(data)
}

// ============================================
// PLACES
// ============================================

function mapPlace(row: any): TravelPlace {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    address: row.address,
    is_favorite: row.is_favorite ?? false,
    visit_count: row.visit_count || 0,
    last_visited_at: row.last_visited_at,
    created_at: row.created_at,
  }
}

export async function getPlaces(companyId: string): Promise<TravelPlace[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_places')
    .select('*')
    .eq('company_id', companyId)
    .order('is_favorite', { ascending: false })
    .order('visit_count', { ascending: false })
    .order('last_visited_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(`Failed to fetch places: ${error.message}`)
  return (data ?? []).map(mapPlace)
}

export async function createPlace(place: Omit<TravelPlace, 'id' | 'created_at'>): Promise<TravelPlace> {
  const { data, error } = await supabaseAdmin
    .from('travel_places')
    .insert(place)
    .select()
    .single()

  if (error) throw new Error(`Failed to create place: ${error.message}`)
  return mapPlace(data)
}

export async function updatePlaceVisitCount(placeId: string): Promise<void> {
  // Use raw SQL via RPC would be ideal, but simple approach:
  const { data } = await supabaseAdmin
    .from('travel_places')
    .select('visit_count')
    .eq('id', placeId)
    .single()

  if (data) {
    await supabaseAdmin
      .from('travel_places')
      .update({
        visit_count: (data.visit_count || 0) + 1,
        last_visited_at: new Date().toISOString(),
      })
      .eq('id', placeId)
  }
}

export async function findOrCreatePlace(companyId: string, name: string, address?: string): Promise<string> {
  // Try to find existing place
  const { data: existing } = await supabaseAdmin
    .from('travel_places')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', name)
    .limit(1)
    .single()

  if (existing) {
    await updatePlaceVisitCount(existing.id)
    return existing.id
  }

  // Create new
  const place = await createPlace({
    company_id: companyId,
    name,
    address: address || null,
    is_favorite: false,
    visit_count: 1,
    last_visited_at: new Date().toISOString(),
  })
  return place.id
}

// ============================================
// TRIPS
// ============================================

function mapTrip(row: any): TravelTrip {
  return {
    id: row.id,
    company_id: row.company_id,
    vehicle_id: row.vehicle_id,
    driver_id: row.driver_id,
    trip_date: row.trip_date,
    departure_time: row.departure_time,
    arrival_time: row.arrival_time,
    origin: row.origin,
    destination: row.destination,
    route_description: row.route_description,
    purpose: row.purpose,
    trip_type: row.trip_type || 'business',
    distance_km: Number(row.distance_km),
    odometer_start: row.odometer_start,
    odometer_end: row.odometer_end,
    is_round_trip: row.is_round_trip ?? false,
    fuel_consumed: row.fuel_consumed ? Number(row.fuel_consumed) : null,
    fuel_cost: row.fuel_cost ? Number(row.fuel_cost) : null,
    rate_per_km: row.rate_per_km ? Number(row.rate_per_km) : null,
    basic_rate_per_km: row.basic_rate_per_km ? Number(row.basic_rate_per_km) : null,
    fuel_price_per_unit: row.fuel_price_per_unit ? Number(row.fuel_price_per_unit) : null,
    reimbursement: row.reimbursement ? Number(row.reimbursement) : null,
    manual_override: row.manual_override ?? false,
    document_ids: row.document_ids,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    vehicle_name: row.travel_vehicles?.name,
    vehicle_license_plate: row.travel_vehicles?.license_plate,
    vehicle_category: row.travel_vehicles?.vehicle_category,
    vehicle_fuel_type: row.travel_vehicles?.fuel_type,
    vehicle_fuel_consumption: row.travel_vehicles?.fuel_consumption ? Number(row.travel_vehicles.fuel_consumption) : null,
    driver_name: row.travel_drivers?.name,
  }
}

export async function getTrips(filters: {
  companyId: string
  month?: string  // YYYY-MM
  vehicleId?: string
  tripType?: string
  limit?: number
}): Promise<TravelTrip[]> {
  let query = supabaseAdmin
    .from('travel_trips')
    .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
    .eq('company_id', filters.companyId)

  if (filters.month) {
    const start = `${filters.month}-01`
    const [y, m] = filters.month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    query = query.gte('trip_date', start).lt('trip_date', nextMonth)
  }

  if (filters.vehicleId) query = query.eq('vehicle_id', filters.vehicleId)
  if (filters.tripType) query = query.eq('trip_type', filters.tripType)

  query = query.order('trip_date', { ascending: false }).order('departure_time', { ascending: false, nullsFirst: true })

  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch trips: ${error.message}`)
  return (data ?? []).map(mapTrip)
}

export async function getTrip(id: string, companyId: string): Promise<TravelTrip | null> {
  const { data, error } = await supabaseAdmin
    .from('travel_trips')
    .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return null
  return mapTrip(data)
}

export async function createTrip(trip: Omit<TravelTrip, 'id' | 'created_at' | 'updated_at' | 'vehicle_name' | 'vehicle_license_plate' | 'vehicle_category' | 'vehicle_fuel_type' | 'vehicle_fuel_consumption' | 'driver_name'>): Promise<TravelTrip> {
  const { vehicle_name: _vn, vehicle_license_plate: _vl, vehicle_category: _vc, vehicle_fuel_type: _vft, vehicle_fuel_consumption: _vfc, driver_name: _dn, ...insertData } = trip as any
  const { data, error } = await supabaseAdmin
    .from('travel_trips')
    .insert(insertData)
    .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
    .single()

  if (error) throw new Error(`Failed to create trip: ${error.message}`)

  // Update vehicle odometer + fuel level
  if (trip.vehicle_id && trip.odometer_end) {
    const updates: any = { current_odometer: trip.odometer_end, updated_at: new Date().toISOString() }

    // Decrease fuel level if consumption data available
    if (trip.fuel_consumed && trip.fuel_consumed > 0) {
      const { data: vehicle } = await supabaseAdmin
        .from('travel_vehicles')
        .select('current_fuel_level')
        .eq('id', trip.vehicle_id)
        .single()

      if (vehicle?.current_fuel_level != null) {
        updates.current_fuel_level = Math.max(0, Number(vehicle.current_fuel_level) - trip.fuel_consumed)
      }
    }

    await supabaseAdmin.from('travel_vehicles').update(updates).eq('id', trip.vehicle_id)
  }

  // Update place visit counts
  await Promise.all([
    findOrCreatePlace(trip.company_id, trip.origin),
    findOrCreatePlace(trip.company_id, trip.destination),
  ])

  return mapTrip(data)
}

export async function updateTrip(id: string, companyId: string, updates: Partial<TravelTrip>): Promise<TravelTrip> {
  const { id: _id, company_id: _cid, created_at: _ca, vehicle_name: _vn, vehicle_license_plate: _vl, driver_name: _dn, ...safeUpdates } = updates as any
  const { data, error } = await supabaseAdmin
    .from('travel_trips')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, travel_vehicles(name, license_plate, vehicle_category, fuel_type, fuel_consumption), travel_drivers(name)')
    .single()

  if (error) throw new Error(`Failed to update trip: ${error.message}`)
  return mapTrip(data)
}

export async function deleteTrip(id: string, companyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('travel_trips')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw new Error(`Failed to delete trip: ${error.message}`)
}

// ============================================
// FUEL LOGS
// ============================================

function mapFuelLog(row: any): TravelFuelLog {
  return {
    id: row.id,
    company_id: row.company_id,
    vehicle_id: row.vehicle_id,
    log_date: row.log_date,
    liters: Number(row.liters),
    price_per_liter: row.price_per_liter ? Number(row.price_per_liter) : null,
    total_price: row.total_price ? Number(row.total_price) : null,
    odometer: row.odometer,
    station_name: row.station_name,
    is_full_tank: row.is_full_tank ?? false,
    document_id: row.document_id,
    created_at: row.created_at,
  }
}

export async function getFuelLogs(companyId: string, vehicleId?: string): Promise<TravelFuelLog[]> {
  let query = supabaseAdmin
    .from('travel_fuel_logs')
    .select('*')
    .eq('company_id', companyId)

  if (vehicleId) query = query.eq('vehicle_id', vehicleId)

  query = query.order('log_date', { ascending: false }).limit(100)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch fuel logs: ${error.message}`)
  return (data ?? []).map(mapFuelLog)
}

export async function createFuelLog(log: Omit<TravelFuelLog, 'id' | 'created_at'>): Promise<TravelFuelLog> {
  const { data, error } = await supabaseAdmin
    .from('travel_fuel_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw new Error(`Failed to create fuel log: ${error.message}`)

  // Update vehicle fuel level + odometer
  const { data: vehicle } = await supabaseAdmin
    .from('travel_vehicles')
    .select('current_fuel_level, tank_capacity')
    .eq('id', log.vehicle_id)
    .single()

  if (vehicle) {
    const currentFuel = Number(vehicle.current_fuel_level) || 0
    const tankCap = Number(vehicle.tank_capacity) || 999
    const newFuel = log.is_full_tank ? tankCap : Math.min(tankCap, currentFuel + log.liters)

    const updates: any = { current_fuel_level: newFuel, updated_at: new Date().toISOString() }
    if (log.odometer) updates.current_odometer = log.odometer

    await supabaseAdmin.from('travel_vehicles').update(updates).eq('id', log.vehicle_id)
  }

  return mapFuelLog(data)
}

// ============================================
// STATS
// ============================================

export async function getTravelStats(companyId: string, period?: { year: number; month?: number }): Promise<TravelStats> {
  let query = supabaseAdmin
    .from('travel_trips')
    .select('distance_km, reimbursement, fuel_cost, trip_type, vehicle_id, travel_vehicles(name, license_plate)')
    .eq('company_id', companyId)

  if (period) {
    if (period.month) {
      const start = `${period.year}-${String(period.month).padStart(2, '0')}-01`
      const nextMonth = period.month === 12
        ? `${period.year + 1}-01-01`
        : `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`
      query = query.gte('trip_date', start).lt('trip_date', nextMonth)
    } else {
      query = query.gte('trip_date', `${period.year}-01-01`).lt('trip_date', `${period.year + 1}-01-01`)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch stats: ${error.message}`)

  const trips = data ?? []
  const vehicleMap = new Map<string, { name: string; plate: string; km: number; trips: number }>()

  let totalKm = 0, totalReimbursement = 0, totalFuelCost = 0, businessKm = 0, privateKm = 0

  for (const t of trips) {
    const km = Number(t.distance_km) || 0
    totalKm += km
    totalReimbursement += Number(t.reimbursement) || 0
    totalFuelCost += Number(t.fuel_cost) || 0

    if (t.trip_type === 'business') businessKm += km
    else privateKm += km

    if (t.vehicle_id) {
      const v = vehicleMap.get(t.vehicle_id)
      const vData = t.travel_vehicles as any
      if (v) {
        v.km += km
        v.trips += 1
      } else {
        vehicleMap.set(t.vehicle_id, {
          name: vData?.name || 'Neznámé',
          plate: vData?.license_plate || '',
          km,
          trips: 1,
        })
      }
    }
  }

  return {
    total_trips: trips.length,
    total_km: Math.round(totalKm * 100) / 100,
    total_reimbursement: Math.round(totalReimbursement * 100) / 100,
    total_fuel_cost: Math.round(totalFuelCost * 100) / 100,
    business_km: Math.round(businessKm * 100) / 100,
    private_km: Math.round(privateKm * 100) / 100,
    trips_by_vehicle: Array.from(vehicleMap.values()).map(v => ({
      vehicle_name: v.name,
      license_plate: v.plate,
      km: Math.round(v.km * 100) / 100,
      trips: v.trips,
    })),
  }
}
