/**
 * Travel AI Randomizer — generates plausible business trips from fuel logs
 *
 * Input: Vehicle info + fuel logs for a given period
 * Output: Array of realistic business trips that match approximate fuel consumption
 *
 * Uses Anthropic Claude API for intelligent trip generation
 * Czech context: real cities, realistic business purposes, legal rates
 */

import {
  TravelVehicle,
  TravelFuelLog,
  TravelTrip,
  TravelPlace,
  calculateReimbursement,
} from '@/lib/types/travel'

export interface RandomizerInput {
  vehicle: TravelVehicle
  fuelLogs: TravelFuelLog[]
  existingPlaces: TravelPlace[]
  existingTrips: TravelTrip[]
  companyName: string
  companyAddress: string | null
  period: { year: number; month: number }
  targetKm?: number // Override: if set, generate trips totaling this km
}

export interface GeneratedTrip {
  trip_date: string
  departure_time: string
  arrival_time: string
  origin: string
  destination: string
  purpose: string
  distance_km: number
  is_round_trip: boolean
  route_description: string
}

export interface RandomizerResult {
  trips: GeneratedTrip[]
  totalKm: number
  estimatedFromFuel: number
  tokensUsed: number
}

// Estimate km from fuel consumption in a period
function estimateKmFromFuel(
  fuelLogs: TravelFuelLog[],
  consumption: number | null
): number {
  if (!consumption || consumption <= 0) return 0

  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0)
  // km = liters / (consumption_per_100km / 100)
  return Math.round(totalLiters / (consumption / 100))
}

// Get working days in a month (Mon-Fri, exclude Czech holidays)
function getWorkingDays(year: number, month: number): string[] {
  const days: string[] = []
  const czechHolidays = getCzechHolidays(year)
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue // weekend

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (czechHolidays.includes(dateStr)) continue

    days.push(dateStr)
  }
  return days
}

function getCzechHolidays(year: number): string[] {
  // Fixed Czech holidays
  const fixed = [
    `${year}-01-01`, // Nový rok
    `${year}-05-01`, // Svátek práce
    `${year}-05-08`, // Den vítězství
    `${year}-07-05`, // Cyril a Metoděj
    `${year}-07-06`, // Jan Hus
    `${year}-09-28`, // Den české státnosti
    `${year}-10-28`, // Vznik Československa
    `${year}-11-17`, // Den boje za svobodu
    `${year}-12-24`, // Štědrý den
    `${year}-12-25`, // 1. svátek vánoční
    `${year}-12-26`, // 2. svátek vánoční
  ]

  // Easter Monday and Good Friday are the variable holidays
  const easter = calculateEaster(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easterMonday.getDate() + 1)
  const goodFriday = new Date(easter)
  goodFriday.setDate(goodFriday.getDate() - 2)
  fixed.push(formatDate(goodFriday))
  fixed.push(formatDate(easterMonday))

  return fixed
}

function calculateEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SYSTEM_PROMPT = `Jsi AI asistent pro generování realistických služebních cest pro českou knihu jízd.

PRAVIDLA:
1. Generuj POUZE služební cesty (trip_type: business)
2. Cesty musí být realistické — skutečná města v ČR, rozumné vzdálenosti
3. Účely musí být věrohodné obchodní důvody
4. Časy odjezdu/příjezdu musí být v pracovní době (7:00-18:00)
5. Celkový počet km se musí blížit cílovému číslu (±10%)
6. Rozlož cesty rovnoměrně přes pracovní dny v měsíci
7. Některé cesty mohou být zpáteční (is_round_trip: true) — v tom případě distance_km je jednosměrná vzdálenost
8. Používej místa která firma pravděpodobně navštěvuje (úřady, klienti, dodavatelé)
9. Nepřesahuj 500 km na jednu cestu
10. Variuj účely: schůzky s klienty, dodavateli, úřady, školení, nákupy

FORMÁT ODPOVĚDI (JSON array):
[
  {
    "trip_date": "2026-03-05",
    "departure_time": "08:30",
    "arrival_time": "10:15",
    "origin": "Praha, Vinohradská 12",
    "destination": "Brno, Masarykova 5",
    "purpose": "Jednání s klientem",
    "distance_km": 205,
    "is_round_trip": false,
    "route_description": "D1 Praha → Brno"
  }
]

Odpovídej POUZE JSON polem, bez dalšího textu.`

export async function generateTrips(input: RandomizerInput): Promise<RandomizerResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const estimatedKm = input.targetKm || estimateKmFromFuel(input.fuelLogs, input.vehicle.fuel_consumption)
  if (estimatedKm <= 0) {
    throw new Error('Cannot estimate km — no fuel logs or consumption data')
  }

  const workingDays = getWorkingDays(input.period.year, input.period.month)
  const existingTripDates = input.existingTrips
    .filter(t => t.trip_date.startsWith(`${input.period.year}-${String(input.period.month).padStart(2, '0')}`))
    .map(t => t.trip_date)

  const availableDays = workingDays.filter(d => !existingTripDates.includes(d))

  const knownPlaces = input.existingPlaces
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, 15)
    .map(p => `${p.name}${p.address ? ` (${p.address})` : ''}`)

  const userPrompt = `Vygeneruj služební cesty pro firmu "${input.companyName}" za ${input.period.month}/${input.period.year}.

VOZIDLO: ${input.vehicle.name} (${input.vehicle.license_plate}), ${input.vehicle.fuel_type}, spotřeba ${input.vehicle.fuel_consumption || '?'} l/100km
SÍDLO FIRMY: ${input.companyAddress || 'Neznámé'}
CÍLOVÝ POČET KM: ${estimatedKm} km (±10%)
ODHADOVÁNO Z: ${input.fuelLogs.length} tankování, celkem ${input.fuelLogs.reduce((s, l) => s + l.liters, 0).toFixed(1)} litrů

DOSTUPNÉ DNY (pracovní, bez existujících cest): ${availableDays.slice(0, 25).join(', ')}
${availableDays.length > 25 ? `... a dalších ${availableDays.length - 25} dní` : ''}

${knownPlaces.length > 0 ? `ZNÁMÁ MÍSTA (preferuj): ${knownPlaces.join('; ')}` : 'Žádná známá místa — vygeneruj realistická.'}

EXISTUJÍCÍ CESTY V MĚSÍCI: ${existingTripDates.length} (${input.existingTrips.reduce((s, t) => s + t.distance_km, 0)} km)

Vygeneruj cesty tak, aby celkový počet km (včetně zpátečních × 2) byl přibližně ${estimatedKm} km.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  const data = await response.json() as {
    content: { type: string; text: string }[]
    usage: { input_tokens: number; output_tokens: number }
  }

  const text = data.content[0]?.text || '[]'
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)

  // Parse JSON from response (handle potential markdown code blocks)
  let parsed: GeneratedTrip[]
  try {
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse AI response: ${text.slice(0, 200)}`)
  }

  // Validate and clean up
  const trips = parsed.filter(t =>
    t.trip_date && t.origin && t.destination && t.distance_km > 0 && t.purpose
  ).map(t => ({
    ...t,
    departure_time: t.departure_time || '08:00',
    arrival_time: t.arrival_time || '17:00',
    is_round_trip: t.is_round_trip ?? false,
    route_description: t.route_description || '',
  }))

  const totalKm = trips.reduce(
    (sum, t) => sum + (t.is_round_trip ? t.distance_km * 2 : t.distance_km),
    0
  )

  return {
    trips,
    totalKm,
    estimatedFromFuel: estimatedKm,
    tokensUsed,
  }
}

// Convert generated trips to DB-ready format with reimbursement calculation
export function prepareTripsForSave(
  trips: GeneratedTrip[],
  vehicle: TravelVehicle,
  companyId: string,
  driverId: string | null
): Omit<TravelTrip, 'id' | 'created_at' | 'updated_at'>[] {
  return trips.map(t => {
    const effectiveKm = t.is_round_trip ? t.distance_km * 2 : t.distance_km
    const reimbursement = calculateReimbursement({
      distanceKm: effectiveKm,
      vehicleCategory: vehicle.vehicle_category,
      fuelConsumptionPer100km: vehicle.fuel_consumption,
      fuelType: vehicle.fuel_type,
    })

    return {
      company_id: companyId,
      vehicle_id: vehicle.id,
      driver_id: driverId,
      trip_date: t.trip_date,
      departure_time: t.departure_time,
      arrival_time: t.arrival_time,
      origin: t.origin,
      destination: t.destination,
      route_description: t.route_description,
      purpose: t.purpose,
      trip_type: 'business' as const,
      distance_km: t.distance_km,
      odometer_start: null,
      odometer_end: null,
      is_round_trip: t.is_round_trip,
      fuel_consumed: vehicle.fuel_consumption
        ? Math.round(effectiveKm * vehicle.fuel_consumption / 100 * 100) / 100
        : null,
      fuel_cost: reimbursement.fuelReimbursement,
      rate_per_km: reimbursement.basicRate,
      basic_rate_per_km: reimbursement.basicRate,
      fuel_price_per_unit: reimbursement.fuelPriceUsed,
      reimbursement: reimbursement.totalReimbursement,
      manual_override: false,
      document_ids: null,
      notes: 'AI generováno',
    }
  })
}
