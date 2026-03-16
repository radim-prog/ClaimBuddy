import { supabaseAdmin } from '@/lib/supabase-admin'

// ── Types ──

export type SessionStatus =
  | 'draft' | 'documents_selected' | 'fuel_verified' | 'vehicles_configured'
  | 'generating' | 'generated' | 'reviewed' | 'exported' | 'failed'

export type DistanceSource = 'ai_estimate' | 'osrm' | 'google_maps' | 'manual'

export interface GenerationSession {
  id: string
  company_id: string
  created_by: string
  period_start: string
  period_end: string
  status: SessionStatus
  input_snapshot: Record<string, unknown> | null
  ai_model: string | null
  ai_tokens_input: number
  ai_tokens_output: number
  ai_calls_count: number
  ai_total_cost_czk: number
  distance_source: DistanceSource
  total_trips: number
  total_km: number
  total_reimbursement: number
  credits_consumed: number
  validation_score: number | null
  validation_issues: unknown[]
  generated_at: string | null
  exported_at: string | null
  created_at: string
  updated_at: string
}

export interface FuelData {
  id: string
  session_id: string
  document_id: string | null
  vehicle_id: string | null
  log_date: string
  liters: number
  price_per_liter: number | null
  total_price: number | null
  odometer: number | null
  station_name: string | null
  source: 'ocr' | 'manual' | 'existing_fuel_log'
  confidence: number
  raw_ocr_fields: Record<string, unknown> | null
  manually_edited: boolean
}

export interface OdometerReading {
  id: string
  session_id: string
  vehicle_id: string
  odometer_start: number
  odometer_end: number
  expected_km: number | null
  actual_km: number
  deviation_pct: number | null
}

export interface DriverAvailability {
  id: string
  session_id: string
  driver_id: string
  total_working_days: number
  vacation_days: string[]
  sick_days: string[]
  available_days: number
}

// ── Sessions ──

export async function createSession(
  companyId: string,
  createdBy: string,
  periodStart: string,
  periodEnd: string
): Promise<GenerationSession> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_sessions')
    .insert({
      company_id: companyId,
      created_by: createdBy,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  return data as GenerationSession
}

export async function getSession(sessionId: string): Promise<GenerationSession | null> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get session: ${error.message}`)
  }
  return data as GenerationSession
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<GenerationSession,
    'status' | 'input_snapshot' | 'ai_model' | 'ai_tokens_input' | 'ai_tokens_output' |
    'ai_calls_count' | 'ai_total_cost_czk' | 'distance_source' | 'total_trips' |
    'total_km' | 'total_reimbursement' | 'credits_consumed' | 'validation_score' |
    'validation_issues' | 'generated_at' | 'exported_at'
  >>
): Promise<GenerationSession> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update session: ${error.message}`)
  return data as GenerationSession
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('travel_generation_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw new Error(`Failed to delete session: ${error.message}`)
}

export async function getSessionsByCompany(companyId: string): Promise<GenerationSession[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_sessions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list sessions: ${error.message}`)
  return (data ?? []) as GenerationSession[]
}

// ── Fuel Data ──

export async function upsertFuelData(
  sessionId: string,
  items: Array<Omit<FuelData, 'id' | 'session_id'>>
): Promise<FuelData[]> {
  const rows = items.map(item => ({ ...item, session_id: sessionId }))

  const { data, error } = await supabaseAdmin
    .from('travel_generation_fuel_data')
    .insert(rows)
    .select('*')

  if (error) throw new Error(`Failed to insert fuel data: ${error.message}`)
  return (data ?? []) as FuelData[]
}

export async function getFuelData(sessionId: string): Promise<FuelData[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_fuel_data')
    .select('*')
    .eq('session_id', sessionId)
    .order('log_date')

  if (error) throw new Error(`Failed to get fuel data: ${error.message}`)
  return (data ?? []) as FuelData[]
}

export async function updateFuelDataItem(
  id: string,
  updates: Partial<Pick<FuelData, 'vehicle_id' | 'log_date' | 'liters' | 'price_per_liter' | 'total_price' | 'odometer' | 'station_name' | 'manually_edited'>>
): Promise<FuelData> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_fuel_data')
    .update({ ...updates, manually_edited: true })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update fuel data: ${error.message}`)
  return data as FuelData
}

export async function deleteFuelDataBySession(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('travel_generation_fuel_data')
    .delete()
    .eq('session_id', sessionId)

  if (error) throw new Error(`Failed to delete fuel data: ${error.message}`)
}

// ── Odometer ──

export async function upsertOdometer(
  sessionId: string,
  vehicleId: string,
  odometerStart: number,
  odometerEnd: number,
  expectedKm?: number
): Promise<OdometerReading> {
  const actualKm = odometerEnd - odometerStart
  const deviationPct = expectedKm && expectedKm > 0
    ? Math.round(((actualKm - expectedKm) / expectedKm) * 10000) / 100
    : null

  const { data, error } = await supabaseAdmin
    .from('travel_generation_odometer')
    .upsert(
      {
        session_id: sessionId,
        vehicle_id: vehicleId,
        odometer_start: odometerStart,
        odometer_end: odometerEnd,
        expected_km: expectedKm ?? null,
        deviation_pct: deviationPct,
      },
      { onConflict: 'session_id,vehicle_id' }
    )
    .select('*')
    .single()

  if (error) throw new Error(`Failed to upsert odometer: ${error.message}`)
  return data as OdometerReading
}

export async function getOdometers(sessionId: string): Promise<OdometerReading[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_odometer')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw new Error(`Failed to get odometers: ${error.message}`)
  return (data ?? []) as OdometerReading[]
}

// ── Driver Availability ──

export async function upsertDriverAvailability(
  sessionId: string,
  driverId: string,
  totalWorkingDays: number,
  vacationDays: string[],
  sickDays: string[]
): Promise<DriverAvailability> {
  const availableDays = totalWorkingDays - vacationDays.length - sickDays.length

  const { data, error } = await supabaseAdmin
    .from('travel_generation_driver_availability')
    .upsert(
      {
        session_id: sessionId,
        driver_id: driverId,
        total_working_days: totalWorkingDays,
        vacation_days: vacationDays,
        sick_days: sickDays,
        available_days: Math.max(0, availableDays),
      },
      { onConflict: 'session_id,driver_id' }
    )
    .select('*')
    .single()

  if (error) throw new Error(`Failed to upsert driver availability: ${error.message}`)
  return data as DriverAvailability
}

export async function getDriverAvailabilities(sessionId: string): Promise<DriverAvailability[]> {
  const { data, error } = await supabaseAdmin
    .from('travel_generation_driver_availability')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw new Error(`Failed to get driver availabilities: ${error.message}`)
  return (data ?? []) as DriverAvailability[]
}

// ── Full Session Load (with all related data) ──

export async function getFullSession(sessionId: string) {
  const [session, fuelData, odometers, drivers] = await Promise.all([
    getSession(sessionId),
    getFuelData(sessionId),
    getOdometers(sessionId),
    getDriverAvailabilities(sessionId),
  ])

  if (!session) return null

  return { session, fuelData, odometers, drivers }
}
