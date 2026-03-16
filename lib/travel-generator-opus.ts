/**
 * Travel Generator — 3-step AI pipeline using Opus 4.6
 *
 * Pipeline:
 * 1. PLANNER (Opus): yearly data → monthly km distribution + destination frequency plan
 * 2. GENERATOR per month (Opus): monthly data → concrete trips with dates, times, odometers
 * 3. VALIDATOR (Sonnet): generated trips + constraints → validation report
 *
 * Post-AI deterministic fixup: auto-correct issues without additional AI calls
 */

import {
  type GenerationSession,
  type FuelData,
  type OdometerReading,
  type DriverAvailability,
  updateSession,
  getFullSession,
} from '@/lib/travel-generation-store'
import {
  type TravelVehicle,
  type TravelTrip,
  type TravelPlace,
  calculateReimbursement,
  BASIC_RATES_PER_KM,
} from '@/lib/types/travel'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ── Hard Limits ──

const MAX_CALLS_PER_SESSION = 20
const MAX_TOTAL_INPUT_TOKENS = 100_000
const MAX_TOTAL_OUTPUT_TOKENS = 80_000
const TIMEOUT_PER_CALL_MS = 120_000
const TIMEOUT_TOTAL_MS = 600_000

const OPUS_MODEL = 'claude-opus-4-20250514'
const SONNET_MODEL = 'claude-sonnet-4-20250514'

// ── Types ──

export interface PipelineProgress {
  step: 'planning' | 'generating' | 'validating' | 'fixing' | 'saving' | 'done' | 'failed'
  pct: number
  message: string
  monthsCompleted?: number
  monthsTotal?: number
}

export interface GeneratedTripRow {
  trip_date: string
  departure_time: string
  arrival_time: string
  origin: string
  destination: string
  purpose: string
  distance_km: number
  is_round_trip: boolean
  route_description: string
  odometer_start: number
  odometer_end: number
  vehicle_id: string
  driver_id: string | null
}

interface MonthPlan {
  month: string // YYYY-MM
  target_km: number
  trips_count: number
  destinations: { name: string; frequency: number }[]
}

interface ValidationIssue {
  type: 'odometer_gap' | 'weekend_trip' | 'holiday_trip' | 'km_mismatch' | 'time_overlap' | 'excessive_daily_km'
  severity: 'error' | 'warning'
  trip_index: number
  message: string
  auto_fixable: boolean
}

interface ValidationReport {
  score: number
  issues: ValidationIssue[]
  summary: string
}

// ── Token tracking ──

interface TokenUsage {
  input: number
  output: number
  calls: number
}

// ── In-memory progress store ──
// Simple Map for progress polling (per session)
const progressStore = new Map<string, PipelineProgress>()

export function getProgress(sessionId: string): PipelineProgress | null {
  return progressStore.get(sessionId) || null
}

function setProgress(sessionId: string, progress: PipelineProgress) {
  progressStore.set(sessionId, progress)
}

// ── Anthropic API call ──

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  usage: TokenUsage,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  if (usage.calls >= MAX_CALLS_PER_SESSION) {
    throw new Error(`Max AI calls reached (${MAX_CALLS_PER_SESSION})`)
  }
  if (usage.input >= MAX_TOTAL_INPUT_TOKENS) {
    throw new Error(`Max input tokens reached (${MAX_TOTAL_INPUT_TOKENS})`)
  }
  if (usage.output >= MAX_TOTAL_OUTPUT_TOKENS) {
    throw new Error(`Max output tokens reached (${MAX_TOTAL_OUTPUT_TOKENS})`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_PER_CALL_MS)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API ${response.status}: ${err.slice(0, 300)}`)
    }

    const data = await response.json() as {
      content: { type: string; text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }

    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0
    usage.input += inputTokens
    usage.output += outputTokens
    usage.calls += 1

    return {
      text: data.content[0]?.text || '',
      inputTokens,
      outputTokens,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function parseJsonFromAI<T>(text: string): T {
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

// ── Czech calendar helpers ──

function getCzechHolidays(year: number): string[] {
  const fixed = [
    `${year}-01-01`, `${year}-05-01`, `${year}-05-08`,
    `${year}-07-05`, `${year}-07-06`, `${year}-09-28`,
    `${year}-10-28`, `${year}-11-17`, `${year}-12-24`,
    `${year}-12-25`, `${year}-12-26`,
  ]
  // Easter
  const a = year % 19
  const b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const eMonth = Math.floor((h + l - 7 * m + 114) / 31)
  const eDay = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(year, eMonth - 1, eDay)
  const goodFriday = new Date(easter)
  goodFriday.setDate(goodFriday.getDate() - 2)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easterMonday.getDate() + 1)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  fixed.push(fmt(goodFriday), fmt(easterMonday))
  return fixed
}

function getWorkingDays(yearMonth: string, vacationDays: string[] = [], sickDays: string[] = []): string[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const holidays = getCzechHolidays(y)
  const excluded = new Set([...holidays, ...vacationDays, ...sickDays])
  const daysInMonth = new Date(y, m, 0).getDate()
  const result: string[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m - 1, d)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!excluded.has(dateStr)) result.push(dateStr)
  }
  return result
}

function getMonthsBetween(start: string, end: string): string[] {
  const months: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

// ── STEP 1: Planner ──

const PLANNER_SYSTEM = `You are an expert Czech accountant's assistant for generating travel diaries (kniha jízd).

You receive yearly data about a company's vehicles, fuel consumption, and destinations.
Your job is to create a monthly distribution plan: how many km per month, how many trips, which destinations.

RULES:
- Distribute km proportionally to fuel consumption each month
- Summer months (June-August) typically have 10-15% fewer business trips
- December has fewer trips (holidays from ~20th)
- January may have fewer trips (New Year)
- Each month must use all working days reasonably (not too many empty days)
- Prefer round trips (there and back same day) for distances < 200km
- Long distance trips (200+ km) are typically one-way with next day return

RESPOND WITH JSON ONLY — no other text:
{
  "months": [
    {
      "month": "YYYY-MM",
      "target_km": 1234,
      "trips_count": 15,
      "destinations": [
        { "name": "Brno", "frequency": 4 },
        { "name": "Ostrava", "frequency": 2 }
      ]
    }
  ]
}`

async function runPlanner(
  session: GenerationSession,
  vehicles: TravelVehicle[],
  fuelData: FuelData[],
  places: TravelPlace[],
  odometers: OdometerReading[],
  usage: TokenUsage,
): Promise<MonthPlan[]> {
  const months = getMonthsBetween(session.period_start, session.period_end)

  // Build fuel summary per month
  const fuelByMonth: Record<string, { liters: number; cost: number; count: number }> = {}
  for (const f of fuelData) {
    const m = f.log_date.slice(0, 7)
    if (!fuelByMonth[m]) fuelByMonth[m] = { liters: 0, cost: 0, count: 0 }
    fuelByMonth[m].liters += f.liters
    fuelByMonth[m].cost += f.total_price || 0
    fuelByMonth[m].count += 1
  }

  // Total km from odometers
  const totalKm = odometers.reduce((s, o) => s + Math.max(0, o.odometer_end - o.odometer_start), 0)

  // Average consumption
  const avgConsumption = vehicles.length > 0
    ? vehicles.reduce((s, v) => s + (v.fuel_consumption || 7), 0) / vehicles.length
    : 7

  // Known places
  const topPlaces = places
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, 20)
    .map(p => `${p.name} (${p.visit_count}x)`)

  const userPrompt = `Create a monthly trip distribution plan for:

PERIOD: ${session.period_start} to ${session.period_end} (${months.length} months)
TOTAL KM (from odometer): ${totalKm > 0 ? totalKm : 'unknown — estimate from fuel'}
VEHICLES: ${vehicles.map(v => `${v.name} (${v.license_plate}, ${v.fuel_consumption || '?'} l/100km)`).join(', ')}
AVG CONSUMPTION: ${avgConsumption.toFixed(1)} l/100km

FUEL DATA BY MONTH:
${months.map(m => {
    const fd = fuelByMonth[m] || { liters: 0, cost: 0, count: 0 }
    const estKm = fd.liters > 0 ? Math.round(fd.liters / (avgConsumption / 100)) : 0
    return `${m}: ${fd.liters.toFixed(0)}L, ${fd.count} receipts → est. ${estKm} km`
  }).join('\n')}

TOTAL FUEL: ${fuelData.reduce((s, f) => s + f.liters, 0).toFixed(0)} L
KNOWN DESTINATIONS: ${topPlaces.length > 0 ? topPlaces.join(', ') : 'none — generate realistic Czech cities'}

Generate a plan for each month. Total km across all months should be approximately ${totalKm > 0 ? totalKm : Math.round(fuelData.reduce((s, f) => s + f.liters, 0) / (avgConsumption / 100))} km.`

  const result = await callAnthropic(OPUS_MODEL, PLANNER_SYSTEM, userPrompt, 4096, usage)
  const parsed = parseJsonFromAI<{ months: MonthPlan[] }>(result.text)
  return parsed.months
}

// ── STEP 2: Generator (per month) ──

const GENERATOR_SYSTEM = `You are an expert Czech travel diary generator. Generate specific business trips for one month.

RULES:
1. Generate ONLY business trips (služební cesty)
2. Use REAL Czech cities and addresses
3. Times must be in working hours (7:00-18:00)
4. Total km must match the target (±5%)
5. Distribute trips evenly across available working days
6. Round trips (tam a zpět): distance_km is ONE WAY, total = 2× for odometer
7. Odometer must be STRICTLY CUMULATIVE — each trip's start = previous trip's end
8. Max 500km one-way per trip, max 800km total per day
9. Realistic business purposes: client meetings, supplier visits, office visits, training, deliveries
10. Departure/arrival times must be realistic for the distance (avg 80km/h highway, 50km/h city)

RESPOND WITH JSON ONLY:
{
  "trips": [
    {
      "trip_date": "2026-01-05",
      "departure_time": "08:30",
      "arrival_time": "10:15",
      "origin": "Praha, Vinohradská 12",
      "destination": "Brno, Masarykova 5",
      "purpose": "Jednání s klientem ABC s.r.o.",
      "distance_km": 205,
      "is_round_trip": true,
      "route_description": "D1 Praha → Brno",
      "odometer_start": 45230,
      "odometer_end": 45640
    }
  ]
}`

async function runGeneratorMonth(
  month: string,
  plan: MonthPlan,
  vehicle: TravelVehicle,
  odometerStart: number,
  companyName: string,
  companyAddress: string,
  availableDays: string[],
  usage: TokenUsage,
): Promise<GeneratedTripRow[]> {
  const userPrompt = `Generate business trips for ${month}:

COMPANY: "${companyName}", address: ${companyAddress || 'Praha'}
VEHICLE: ${vehicle.name} (${vehicle.license_plate}), ${vehicle.fuel_consumption || '?'} l/100km
ODOMETER START: ${odometerStart} km
TARGET KM: ${plan.target_km} km total (including round trip × 2)
TARGET TRIPS: ~${plan.trips_count}

AVAILABLE WORKING DAYS: ${availableDays.join(', ')}

PLANNED DESTINATIONS:
${plan.destinations.map(d => `- ${d.name}: ${d.frequency}× this month`).join('\n')}

IMPORTANT:
- Odometer must start at ${odometerStart} and be strictly cumulative
- For round trips: odometer_end = odometer_start + (distance_km × 2)
- For one-way trips: odometer_end = odometer_start + distance_km
- Total km (sum of all odometer differences) ≈ ${plan.target_km} (±5%)
- Only use dates from the available working days list above`

  const result = await callAnthropic(OPUS_MODEL, GENERATOR_SYSTEM, userPrompt, 8192, usage)
  const parsed = parseJsonFromAI<{ trips: GeneratedTripRow[] }>(result.text)

  return parsed.trips.map(t => ({
    ...t,
    vehicle_id: vehicle.id,
    driver_id: null,
  }))
}

// ── STEP 3: Validator ──

const VALIDATOR_SYSTEM = `You validate a Czech travel diary (kniha jízd) for consistency.

Check for these issues:
1. ODOMETER: Must be strictly cumulative (each trip start = previous trip end). Any gap or overlap is an error.
2. WEEKENDS: No trips on Saturday (6) or Sunday (0). Flag as error.
3. HOLIDAYS: No trips on Czech holidays. Flag as error.
4. KM_MISMATCH: Monthly km total vs fuel consumption should be reasonable (±20%).
5. TIME_OVERLAP: No two trips on the same day with overlapping times. Flag as error.
6. EXCESSIVE_KM: No more than 800 km in a single day. Flag as warning.
7. VACATION: No trips on vacation/sick days. Flag as error.

Score 0-100: 100 = perfect, deduct 5 per error, 2 per warning.

RESPOND WITH JSON ONLY:
{
  "score": 95,
  "issues": [
    {
      "type": "odometer_gap",
      "severity": "error",
      "trip_index": 5,
      "message": "Odometer gap: trip 5 starts at 45800 but trip 4 ended at 45750",
      "auto_fixable": true
    }
  ],
  "summary": "2 minor issues found, both auto-fixable"
}`

async function runValidator(
  allTrips: GeneratedTripRow[],
  fuelData: FuelData[],
  odometers: OdometerReading[],
  vacationDays: string[],
  sickDays: string[],
  usage: TokenUsage,
): Promise<ValidationReport> {
  const tripsStr = allTrips.map((t, i) => (
    `[${i}] ${t.trip_date} ${t.departure_time}-${t.arrival_time} ${t.origin}→${t.destination} ` +
    `${t.distance_km}km ${t.is_round_trip ? '(RT)' : '(OW)'} odo:${t.odometer_start}→${t.odometer_end}`
  )).join('\n')

  const totalFuelLiters = fuelData.reduce((s, f) => s + f.liters, 0)
  const totalTripKm = allTrips.reduce((s, t) => s + (t.odometer_end - t.odometer_start), 0)

  const userPrompt = `Validate this travel diary:

TRIPS (${allTrips.length}):
${tripsStr}

CONSTRAINTS:
- Total fuel: ${totalFuelLiters.toFixed(0)} L
- Expected odometer ranges: ${odometers.map(o => `${o.vehicle_id}: ${o.odometer_start}→${o.odometer_end} (${o.odometer_end - o.odometer_start} km)`).join(', ')}
- Total trip km: ${totalTripKm}
- Vacation days: ${vacationDays.length > 0 ? vacationDays.join(', ') : 'none'}
- Sick days: ${sickDays.length > 0 ? sickDays.join(', ') : 'none'}

Check all 7 validation rules and return the report.`

  const result = await callAnthropic(SONNET_MODEL, VALIDATOR_SYSTEM, userPrompt, 4096, usage)
  return parseJsonFromAI<ValidationReport>(result.text)
}

// ── Deterministic Fixup ──

function applyFixes(trips: GeneratedTripRow[], issues: ValidationIssue[], availableDays: string[]): GeneratedTripRow[] {
  const fixed = [...trips]
  const holidays = new Set<string>()
  const allYears = new Set(trips.map(t => parseInt(t.trip_date.slice(0, 4))))
  for (const y of allYears) {
    getCzechHolidays(y).forEach(h => holidays.add(h))
  }

  const availableSet = new Set(availableDays)
  const usedDates = new Set(trips.map(t => t.trip_date))

  for (const issue of issues) {
    if (!issue.auto_fixable) continue
    const idx = issue.trip_index
    if (idx < 0 || idx >= fixed.length) continue

    switch (issue.type) {
      case 'weekend_trip':
      case 'holiday_trip': {
        // Shift to next available working day
        const trip = fixed[idx]
        const nextDay = findNextAvailableDay(trip.trip_date, availableSet, usedDates)
        if (nextDay) {
          usedDates.delete(trip.trip_date)
          trip.trip_date = nextDay
          usedDates.add(nextDay)
        }
        break
      }
      case 'odometer_gap': {
        // Recalculate odometers sequentially
        // Will be handled in bulk below
        break
      }
      case 'excessive_daily_km': {
        // Reduce distance proportionally
        const trip = fixed[idx]
        const kmDiff = trip.odometer_end - trip.odometer_start
        if (kmDiff > 800) {
          const ratio = 750 / kmDiff
          trip.distance_km = Math.round(trip.distance_km * ratio)
          trip.odometer_end = trip.odometer_start + Math.round(kmDiff * ratio)
        }
        break
      }
    }
  }

  // Always recalculate odometers sequentially to ensure consistency
  recalculateOdometers(fixed)

  return fixed
}

function findNextAvailableDay(fromDate: string, available: Set<string>, used: Set<string>): string | null {
  const date = new Date(fromDate)
  for (let i = 1; i <= 14; i++) {
    date.setDate(date.getDate() + 1)
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (available.has(ds) && !used.has(ds)) return ds
  }
  return null
}

function recalculateOdometers(trips: GeneratedTripRow[]) {
  if (trips.length === 0) return

  // Sort by date then time
  trips.sort((a, b) => {
    const dc = a.trip_date.localeCompare(b.trip_date)
    if (dc !== 0) return dc
    return (a.departure_time || '').localeCompare(b.departure_time || '')
  })

  // First trip keeps its odometer_start, rest chain
  for (let i = 1; i < trips.length; i++) {
    trips[i].odometer_start = trips[i - 1].odometer_end
    const km = trips[i].is_round_trip ? trips[i].distance_km * 2 : trips[i].distance_km
    trips[i].odometer_end = trips[i].odometer_start + km
  }
  // Also fix first trip
  const km0 = trips[0].is_round_trip ? trips[0].distance_km * 2 : trips[0].distance_km
  trips[0].odometer_end = trips[0].odometer_start + km0
}

// ── Main Pipeline ──

export async function runPipeline(sessionId: string): Promise<void> {
  const totalStart = Date.now()
  const usage: TokenUsage = { input: 0, output: 0, calls: 0 }

  try {
    setProgress(sessionId, { step: 'planning', pct: 5, message: 'Nacitam data session...' })

    // Load full session data
    const fullSession = await getFullSession(sessionId)
    if (!fullSession) throw new Error('Session not found')
    const { session, fuelData, odometers, drivers } = fullSession

    // Update session status
    await updateSession(sessionId, { status: 'generating' })

    // Load company info
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, address_street, address_city')
      .eq('id', session.company_id)
      .single()

    const companyName = company?.name || 'Firma'
    const companyAddress = [company?.address_street, company?.address_city].filter(Boolean).join(', ') || 'Praha'

    // Load vehicles
    const { data: vehicleRows } = await supabaseAdmin
      .from('travel_vehicles')
      .select('*')
      .eq('company_id', session.company_id)
      .eq('is_active', true)

    const vehicles = (vehicleRows || []) as TravelVehicle[]
    if (vehicles.length === 0) throw new Error('No active vehicles found')

    // Load known places
    const { data: placeRows } = await supabaseAdmin
      .from('travel_places')
      .select('*')
      .eq('company_id', session.company_id)
      .order('visit_count', { ascending: false })
      .limit(30)

    const places = (placeRows || []) as TravelPlace[]

    // Collect vacation/sick days from driver availability
    const allVacation: string[] = []
    const allSick: string[] = []
    for (const d of drivers) {
      allVacation.push(...(d.vacation_days || []))
      allSick.push(...(d.sick_days || []))
    }

    // ── STEP 1: Planner ──
    setProgress(sessionId, { step: 'planning', pct: 10, message: 'AI planuje rozlozeni km...' })
    checkTimeout(totalStart)

    const monthPlans = await runPlanner(session, vehicles, fuelData, places, odometers, usage)

    // ── STEP 2: Generator (per month) ──
    const months = getMonthsBetween(session.period_start, session.period_end)
    const allTrips: GeneratedTripRow[] = []
    const primaryVehicle = vehicles[0]

    // Starting odometer from first reading or vehicle current
    let runningOdometer = odometers.length > 0
      ? Math.min(...odometers.map(o => o.odometer_start))
      : primaryVehicle.current_odometer

    for (let i = 0; i < months.length; i++) {
      const month = months[i]
      const plan = monthPlans.find(p => p.month === month) || {
        month,
        target_km: 500,
        trips_count: 10,
        destinations: [{ name: companyAddress, frequency: 5 }],
      }

      const pct = 15 + Math.round((i / months.length) * 55)
      setProgress(sessionId, {
        step: 'generating',
        pct,
        message: `Generuji cesty pro ${month}...`,
        monthsCompleted: i,
        monthsTotal: months.length,
      })
      checkTimeout(totalStart)

      const workingDays = getWorkingDays(month, allVacation, allSick)

      const monthTrips = await runGeneratorMonth(
        month,
        plan,
        primaryVehicle,
        runningOdometer,
        companyName,
        companyAddress,
        workingDays,
        usage,
      )

      // Update running odometer
      if (monthTrips.length > 0) {
        // Fix odometer chain for this month starting from runningOdometer
        monthTrips[0].odometer_start = runningOdometer
        const km0 = monthTrips[0].is_round_trip ? monthTrips[0].distance_km * 2 : monthTrips[0].distance_km
        monthTrips[0].odometer_end = runningOdometer + km0

        for (let j = 1; j < monthTrips.length; j++) {
          monthTrips[j].odometer_start = monthTrips[j - 1].odometer_end
          const km = monthTrips[j].is_round_trip ? monthTrips[j].distance_km * 2 : monthTrips[j].distance_km
          monthTrips[j].odometer_end = monthTrips[j].odometer_start + km
        }

        runningOdometer = monthTrips[monthTrips.length - 1].odometer_end
      }

      allTrips.push(...monthTrips)
    }

    // ── STEP 3: Validator ──
    setProgress(sessionId, { step: 'validating', pct: 75, message: 'Validuji konzistenci...' })
    checkTimeout(totalStart)

    const validationReport = await runValidator(allTrips, fuelData, odometers, allVacation, allSick, usage)

    // ── STEP 4: Deterministic fixup ──
    const fixableIssues = validationReport.issues.filter(i => i.auto_fixable)
    let finalTrips = allTrips

    if (fixableIssues.length > 0) {
      setProgress(sessionId, { step: 'fixing', pct: 85, message: `Opravuji ${fixableIssues.length} problemu...` })
      const allWorkingDays = months.flatMap(m => getWorkingDays(m, allVacation, allSick))
      finalTrips = applyFixes(allTrips, validationReport.issues, allWorkingDays)
    }

    // ── STEP 5: Save trips ──
    setProgress(sessionId, { step: 'saving', pct: 90, message: 'Ukladam vygenerovane cesty...' })

    const tripsToInsert = finalTrips.map((t, idx) => {
      const effectiveKm = t.is_round_trip ? t.distance_km * 2 : t.distance_km
      const reimbursement = calculateReimbursement({
        distanceKm: effectiveKm,
        vehicleCategory: primaryVehicle.vehicle_category,
        fuelConsumptionPer100km: primaryVehicle.fuel_consumption,
        fuelType: primaryVehicle.fuel_type,
      })

      return {
        company_id: session.company_id,
        vehicle_id: t.vehicle_id,
        driver_id: t.driver_id,
        trip_date: t.trip_date,
        departure_time: t.departure_time,
        arrival_time: t.arrival_time,
        origin: t.origin,
        destination: t.destination,
        route_description: t.route_description || null,
        purpose: t.purpose,
        trip_type: 'business' as const,
        distance_km: t.distance_km,
        odometer_start: t.odometer_start,
        odometer_end: t.odometer_end,
        is_round_trip: t.is_round_trip,
        fuel_consumed: primaryVehicle.fuel_consumption
          ? Math.round(effectiveKm * primaryVehicle.fuel_consumption / 100 * 100) / 100
          : null,
        fuel_cost: reimbursement.fuelReimbursement,
        rate_per_km: reimbursement.basicRate,
        basic_rate_per_km: reimbursement.basicRate,
        fuel_price_per_unit: reimbursement.fuelPriceUsed,
        reimbursement: reimbursement.totalReimbursement,
        manual_override: false,
        document_ids: null,
        notes: 'AI generovano (Opus pipeline)',
        generation_session_id: sessionId,
        generation_order: idx,
      }
    })

    // Insert in batches of 50
    for (let i = 0; i < tripsToInsert.length; i += 50) {
      const batch = tripsToInsert.slice(i, i + 50)
      const { error } = await supabaseAdmin.from('travel_trips').insert(batch)
      if (error) throw new Error(`Failed to save trips batch ${i}: ${error.message}`)
    }

    // ── STEP 6: Update session ──
    const totalKm = finalTrips.reduce((s, t) => s + (t.odometer_end - t.odometer_start), 0)
    const totalReimbursement = tripsToInsert.reduce((s, t) => s + (t.reimbursement || 0), 0)

    // Estimate cost (Opus: $15/MTok in, $75/MTok out; Sonnet: $3/MTok in, $15/MTok out)
    // Approximate: most calls are Opus
    const opusCostCzk = ((usage.input / 1_000_000) * 15 + (usage.output / 1_000_000) * 75) * 24 // ~24 CZK/USD
    const creditsConsumed = Math.max(1, Math.ceil(months.length / 4))

    await updateSession(sessionId, {
      status: 'generated',
      ai_model: OPUS_MODEL,
      ai_tokens_input: usage.input,
      ai_tokens_output: usage.output,
      ai_calls_count: usage.calls,
      ai_total_cost_czk: Math.round(opusCostCzk * 100) / 100,
      total_trips: finalTrips.length,
      total_km: totalKm,
      total_reimbursement: Math.round(totalReimbursement * 100) / 100,
      credits_consumed: creditsConsumed,
      validation_score: validationReport.score,
      validation_issues: validationReport.issues as unknown[],
      generated_at: new Date().toISOString(),
    })

    setProgress(sessionId, {
      step: 'done',
      pct: 100,
      message: `Hotovo! ${finalTrips.length} cest, ${totalKm} km, ${usage.calls} AI volani`,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Pipeline failed for session ${sessionId}:`, message)

    setProgress(sessionId, {
      step: 'failed',
      pct: 0,
      message: `Chyba: ${message.slice(0, 200)}`,
    })

    try {
      await updateSession(sessionId, {
        status: 'failed',
        ai_tokens_input: usage.input,
        ai_tokens_output: usage.output,
        ai_calls_count: usage.calls,
        validation_issues: [{ error: message }] as unknown[],
      })
    } catch {
      // Session update failed too — already logged
    }
  }
}

function checkTimeout(startTime: number) {
  if (Date.now() - startTime > TIMEOUT_TOTAL_MS) {
    throw new Error(`Pipeline timeout (${TIMEOUT_TOTAL_MS / 1000}s exceeded)`)
  }
}
