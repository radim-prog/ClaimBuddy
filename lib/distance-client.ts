/**
 * Distance Client — OSRM routing + Nominatim geocoding + DB cache
 *
 * Flow: Check cache → Geocode (Nominatim) → Route (OSRM) → Cache result
 * All free, no API keys needed. Rate limit: ~1 req/s for public instances.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

// ── Types ──

export interface DistanceResult {
  origin: string
  destination: string
  distance_km: number
  duration_minutes: number
  route_description: string | null
  source: 'cache' | 'osrm' | 'fallback'
}

interface GeoCoord {
  lat: number
  lon: number
  display_name: string
}

// ── Constants ──

const OSRM_BASE = 'https://router.project-osrm.org'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'UcetniOS-Travel/1.0 (info@zajcon.cz)'
const REQUEST_DELAY_MS = 1100 // ~1 req/s rate limit for public APIs

// Semaphore to prevent parallel requests to public APIs
let lastRequestTime = 0

async function rateLimitWait() {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - elapsed))
  }
  lastRequestTime = Date.now()
}

// ── Normalization ──

function normalizePlace(place: string): string {
  return place
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s*česká\s*republika$/i, '')
    .replace(/,\s*czech\s*republic$/i, '')
    .replace(/\bč\.\s*r\.\s*$/i, '')
    .trim()
}

// ── Cache ──

async function getCachedDistance(
  originNorm: string,
  destNorm: string,
): Promise<DistanceResult | null> {
  const { data } = await supabaseAdmin
    .from('travel_distance_cache')
    .select('distance_km, duration_minutes, route_description, source')
    .eq('origin_normalized', originNorm)
    .eq('destination_normalized', destNorm)
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    origin: originNorm,
    destination: destNorm,
    distance_km: data.distance_km,
    duration_minutes: data.duration_minutes || 0,
    route_description: data.route_description,
    source: 'cache',
  }
}

async function cacheDistance(
  originNorm: string,
  destNorm: string,
  distanceKm: number,
  durationMinutes: number,
  routeDescription: string | null,
  source: 'osrm' | 'manual' = 'osrm',
): Promise<void> {
  await supabaseAdmin
    .from('travel_distance_cache')
    .upsert(
      {
        origin_normalized: originNorm,
        destination_normalized: destNorm,
        distance_km: distanceKm,
        duration_minutes: durationMinutes,
        route_description: routeDescription,
        source,
      },
      { onConflict: 'origin_normalized,destination_normalized,source' }
    )
    .select()
}

// ── Geocoding (Nominatim) ──

async function geocode(place: string): Promise<GeoCoord | null> {
  const query = `${place}, Czech Republic`

  await rateLimitWait()

  try {
    const url = `${NOMINATIM_BASE}/search?${new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'cz',
    })}`

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data || data.length === 0) return null

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    }
  } catch {
    return null
  }
}

// ── Routing (OSRM) ──

async function osrmRoute(
  origin: GeoCoord,
  dest: GeoCoord,
): Promise<{ distance_km: number; duration_minutes: number } | null> {
  await rateLimitWait()

  try {
    // OSRM format: /route/v1/driving/lon1,lat1;lon2,lat2
    const url = `${OSRM_BASE}/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null

    const route = data.routes[0]
    return {
      distance_km: Math.round(route.distance / 100) / 10, // meters → km, 1 decimal
      duration_minutes: Math.round(route.duration / 60),
    }
  } catch {
    return null
  }
}

// ── Main API ──

/**
 * Get driving distance between two Czech places.
 * Uses cache first, then Nominatim geocoding + OSRM routing.
 */
export async function getDistance(
  origin: string,
  destination: string,
): Promise<DistanceResult> {
  const originNorm = normalizePlace(origin)
  const destNorm = normalizePlace(destination)

  // Same place
  if (originNorm === destNorm) {
    return {
      origin: originNorm,
      destination: destNorm,
      distance_km: 0,
      duration_minutes: 0,
      route_description: 'Same location',
      source: 'fallback',
    }
  }

  // Check both directions in cache
  const cached = await getCachedDistance(originNorm, destNorm)
    || await getCachedDistance(destNorm, originNorm)
  if (cached) return { ...cached, source: 'cache' }

  // Geocode both places
  const [originCoord, destCoord] = await Promise.all([
    geocode(originNorm),
    geocode(destNorm),
  ])

  if (!originCoord || !destCoord) {
    // Fallback: return estimate based on common Czech city distances
    const fallback = getFallbackDistance(originNorm, destNorm)
    return {
      origin: originNorm,
      destination: destNorm,
      distance_km: fallback.distance_km,
      duration_minutes: fallback.duration_minutes,
      route_description: 'Fallback estimate (geocoding failed)',
      source: 'fallback',
    }
  }

  // Get OSRM route
  const route = await osrmRoute(originCoord, destCoord)

  if (!route) {
    // Fallback: straight-line distance * 1.3 road factor
    const straightLine = haversineDistance(originCoord, destCoord)
    const estimatedKm = Math.round(straightLine * 1.3 * 10) / 10
    const estimatedMin = Math.round(estimatedKm / 1.2) // ~72 km/h average

    return {
      origin: originNorm,
      destination: destNorm,
      distance_km: estimatedKm,
      duration_minutes: estimatedMin,
      route_description: 'Straight-line estimate (OSRM unavailable)',
      source: 'fallback',
    }
  }

  // Cache the result
  const description = `${originCoord.display_name} → ${destCoord.display_name}`
  await cacheDistance(originNorm, destNorm, route.distance_km, route.duration_minutes, description)

  return {
    origin: originNorm,
    destination: destNorm,
    distance_km: route.distance_km,
    duration_minutes: route.duration_minutes,
    route_description: description,
    source: 'osrm',
  }
}

/**
 * Batch distance lookup — processes multiple origin-destination pairs.
 * Maximizes cache hits, minimizes API calls.
 */
export async function getBatchDistances(
  pairs: Array<{ origin: string; destination: string }>,
): Promise<DistanceResult[]> {
  const results: DistanceResult[] = []

  for (const pair of pairs) {
    const result = await getDistance(pair.origin, pair.destination)
    results.push(result)
  }

  return results
}

// ── Haversine Distance ──

function haversineDistance(a: GeoCoord, b: GeoCoord): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// ── Fallback Common Distances ──

const COMMON_DISTANCES: Record<string, Record<string, number>> = {
  'praha': { 'brno': 205, 'ostrava': 370, 'plzeň': 93, 'liberec': 110, 'olomouc': 280, 'české budějovice': 150, 'hradec králové': 115, 'pardubice': 125, 'zlín': 300, 'karlovy vary': 130 },
  'brno': { 'ostrava': 170, 'olomouc': 78, 'zlín': 100, 'jihlava': 90, 'pardubice': 150 },
  'ostrava': { 'olomouc': 100, 'zlín': 90, 'opava': 35, 'frýdek-místek': 20 },
}

function getFallbackDistance(
  origin: string,
  destination: string,
): { distance_km: number; duration_minutes: number } {
  // Try direct lookup
  const d1 = COMMON_DISTANCES[origin]?.[destination]
  if (d1) return { distance_km: d1, duration_minutes: Math.round(d1 / 1.2) }

  // Try reverse
  const d2 = COMMON_DISTANCES[destination]?.[origin]
  if (d2) return { distance_km: d2, duration_minutes: Math.round(d2 / 1.2) }

  // Default: 50km (intra-city or unknown)
  return { distance_km: 50, duration_minutes: 45 }
}
