// Travel diary (Kniha jízd) types
// Based on Czech legislation: zákoník práce § 157, vyhláška 573/2025 Sb.

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng'
export type TripType = 'business' | 'private' | 'commute'
export type VehicleCategory = 'car' | 'motorcycle' | 'truck'

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  business: 'Služební',
  private: 'Soukromá',
  commute: 'Dojíždění do práce',
}

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  car: 'Osobní automobil',
  motorcycle: 'Motocykl / tříkolka',
  truck: 'Nákladní / autobus / traktor',
}

export const PURPOSE_SUGGESTIONS = [
  'Jednání s klientem',
  'Obchodní schůzka',
  'Nákup materiálu',
  'Pracovní cesta',
  'Návštěva dodavatele',
  'Školení',
  'Přeprava materiálu',
  'Servis vozidla',
  'Návštěva úřadu',
  'Přeprava zboží',
]

// ============================================================
// Legal rates for 2026 (vyhláška 573/2025 Sb.)
// These are NOT user-editable — set by Czech law
// ============================================================

// Základní náhrada za 1 km jízdy (§ 157 odst. 4 ZP)
export const BASIC_RATES_PER_KM: Record<VehicleCategory, number> = {
  car: 5.90,         // osobní automobil
  motorcycle: 1.60,  // jednostopé a tříkolové vozidlo
  truck: 11.80,      // nákladní auto, autobus, traktor (2× car)
}

// Příplatek za přívěs: +15% k základní sazbě
export const TRAILER_SURCHARGE = 0.15

// Průměrné ceny PHM (pokud zaměstnanec neprokáže dokladem)
export const DECREE_FUEL_PRICES: Record<string, { price: number; unit: string; label: string }> = {
  petrol: { price: 34.70, unit: 'Kč/l', label: 'Benzin 95' },
  petrol_98: { price: 39.00, unit: 'Kč/l', label: 'Benzin 98' },
  diesel: { price: 34.10, unit: 'Kč/l', label: 'Nafta' },
  electric: { price: 7.20, unit: 'Kč/kWh', label: 'Elektřina' },
  lpg: { price: 14.60, unit: 'Kč/l', label: 'LPG' },
  cng: { price: 30.00, unit: 'Kč/kg', label: 'CNG' },
}

// Paušální náhrada za dopravu (§ 24 odst. 2 písm. k) ZDP)
export const MONTHLY_LUMP_SUM = {
  full: 5000,   // výhradně podnikání
  partial: 4000, // i soukromé užití
}

// Backwards compat alias (used in some components)
export const DEFAULT_RATES = {
  car: BASIC_RATES_PER_KM.car,
  motorcycle: BASIC_RATES_PER_KM.motorcycle,
  monthly_lump: MONTHLY_LUMP_SUM.full,
}

/**
 * Calculate total reimbursement for a trip (dvousložková náhrada)
 * 1. Základní náhrada = km × zákonná sazba
 * 2. Náhrada za PHM = km × spotřeba / 100 × cena PHM
 */
export function calculateReimbursement(params: {
  distanceKm: number
  vehicleCategory: VehicleCategory
  fuelConsumptionPer100km: number | null
  fuelType: FuelType
  actualFuelPrice?: number | null  // from receipt, if available
  hasTrailer?: boolean
}): {
  basicRate: number
  basicReimbursement: number
  fuelPriceUsed: number
  fuelReimbursement: number
  totalReimbursement: number
} {
  const { distanceKm, vehicleCategory, fuelConsumptionPer100km, fuelType, actualFuelPrice, hasTrailer } = params

  // Component 1: basic rate
  let basicRate = BASIC_RATES_PER_KM[vehicleCategory] || BASIC_RATES_PER_KM.car
  if (hasTrailer) basicRate *= (1 + TRAILER_SURCHARGE)
  const basicReimbursement = distanceKm * basicRate

  // Component 2: fuel reimbursement
  const fuelKey = fuelType === 'hybrid' ? 'petrol' : fuelType
  const decreeFuelPrice = DECREE_FUEL_PRICES[fuelKey]?.price || DECREE_FUEL_PRICES.petrol.price
  const fuelPriceUsed = actualFuelPrice || decreeFuelPrice
  const consumption = fuelConsumptionPer100km || 0
  const fuelReimbursement = distanceKm * consumption / 100 * fuelPriceUsed

  return {
    basicRate: Math.round(basicRate * 100) / 100,
    basicReimbursement: Math.round(basicReimbursement * 100) / 100,
    fuelPriceUsed: Math.round(fuelPriceUsed * 100) / 100,
    fuelReimbursement: Math.round(fuelReimbursement * 100) / 100,
    totalReimbursement: Math.round((basicReimbursement + fuelReimbursement) * 100) / 100,
  }
}

export type TravelVehicle = {
  id: string
  company_id: string
  name: string
  license_plate: string
  brand: string | null
  model: string | null
  year: number | null
  vin: string | null
  fuel_type: FuelType
  fuel_consumption: number | null  // l/100km from technical certificate
  tank_capacity: number | null
  current_fuel_level: number | null
  current_odometer: number
  vehicle_category: VehicleCategory
  rate_per_km: number  // legacy, kept for backwards compat
  is_company_car: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TravelDriver = {
  id: string
  company_id: string
  name: string
  email: string | null
  phone: string | null
  license_number: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

export type TravelPlace = {
  id: string
  company_id: string
  name: string
  address: string | null
  is_favorite: boolean
  visit_count: number
  last_visited_at: string | null
  created_at: string
}

export type TravelTrip = {
  id: string
  company_id: string
  vehicle_id: string | null
  driver_id: string | null
  trip_date: string
  departure_time: string | null
  arrival_time: string | null
  origin: string
  destination: string
  route_description: string | null
  purpose: string
  trip_type: TripType
  distance_km: number
  odometer_start: number | null
  odometer_end: number | null
  is_round_trip: boolean
  fuel_consumed: number | null
  fuel_cost: number | null
  rate_per_km: number | null       // legacy basic rate snapshot
  basic_rate_per_km: number | null  // zákonná sazba at time of trip
  fuel_price_per_unit: number | null // fuel price used (decree or actual)
  reimbursement: number | null      // total (basic + fuel)
  manual_override: boolean
  document_ids: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  vehicle_name?: string
  vehicle_license_plate?: string
  vehicle_category?: VehicleCategory
  vehicle_fuel_type?: FuelType
  vehicle_fuel_consumption?: number | null
  driver_name?: string
}

export type TravelFuelLog = {
  id: string
  company_id: string
  vehicle_id: string
  log_date: string
  liters: number
  price_per_liter: number | null
  total_price: number | null
  odometer: number | null
  station_name: string | null
  is_full_tank: boolean
  document_id: string | null
  created_at: string
}

export type TravelStats = {
  total_trips: number
  total_km: number
  total_reimbursement: number
  total_fuel_cost: number
  business_km: number
  private_km: number
  trips_by_vehicle: { vehicle_name: string; license_plate: string; km: number; trips: number }[]
}
