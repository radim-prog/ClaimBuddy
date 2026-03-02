// Travel diary (Kniha jízd) types

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng'
export type TripType = 'business' | 'private' | 'commute'

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  business: 'Služební',
  private: 'Soukromá',
  commute: 'Dojíždění',
}

export const PURPOSE_SUGGESTIONS = [
  'Jednání s klientem',
  'Návštěva finančního úřadu',
  'Dodání dokladů',
  'Pracovní cesta',
  'Návštěva dodavatele',
  'Školení',
  'Přeprava materiálu',
  'Servis vozidla',
  'Obchodní schůzka',
  'Kontrola na pobočce',
]

// Default rates for 2026 (Czech legislation)
export const DEFAULT_RATES = {
  car: 5.90,       // Kč/km osobní auto
  motorcycle: 1.50, // Kč/km jednostopé
  monthly_lump: 5000, // paušál Kč/měsíc
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
  fuel_consumption: number | null
  tank_capacity: number | null
  current_fuel_level: number | null
  current_odometer: number
  rate_per_km: number
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
  rate_per_km: number | null
  reimbursement: number | null
  manual_override: boolean
  document_ids: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  vehicle_name?: string
  vehicle_license_plate?: string
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
