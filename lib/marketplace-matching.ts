import { supabaseAdmin } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchCriteria {
  businessType: string          // e.g. 'sro', 'osvc', 'as'
  services: string[]            // e.g. ['účetnictví', 'mzdy', 'daně']
  budgetMin?: number
  budgetMax?: number
  city?: string
  region?: string
}

export interface MatchResult {
  providerId: string
  providerName: string
  totalScore: number            // 0-100 (featured providers can exceed 100)
  breakdown: {
    typeMatch: number           // 0-30
    priceRange: number          // 0-20
    geoDistance: number         // 0-15
    rating: number              // 0-20
    availability: number        // 0-15
  }
  provider: {
    id: string
    name: string
    city: string | null
    specializations: string[] | null
    services: string[] | null
    min_price: number | null
    max_price: number | null
    capacity_status: string
    avgRating: number | null
    reviewCount: number
  }
}

// ---------------------------------------------------------------------------
// Scoring functions (pure, no side effects)
// ---------------------------------------------------------------------------

const MAX_TYPE = 30
const MAX_PRICE = 20
const MAX_GEO = 15
const MAX_RATING = 20
const MAX_AVAIL = 15
const FEATURED_BONUS = 5

/**
 * Type match scoring (0-30 pts).
 *
 * Split into two sub-scores:
 *  - businessType match within specializations: up to 15 pts
 *  - service overlap ratio: up to 15 pts
 */
export function scoreTypeMatch(
  providerSpecs: string[],
  providerServices: string[],
  clientType: string,
  clientServices: string[],
): number {
  const norm = (s: string) => s.toLowerCase().trim()

  // --- Specialization match (0-15) ---
  const normalizedSpecs = (providerSpecs ?? []).map(norm)
  const normalizedType = norm(clientType)

  let specScore = 0
  if (normalizedType && normalizedSpecs.length > 0) {
    if (normalizedSpecs.includes(normalizedType)) {
      specScore = 15
    } else if (normalizedSpecs.some((s) => s.includes(normalizedType) || normalizedType.includes(s))) {
      // Partial / substring match
      specScore = 8
    }
  }

  // --- Service overlap (0-15) ---
  let serviceScore = 0
  if (clientServices.length > 0) {
    const normalizedProvServices = (providerServices ?? []).map(norm)
    const matches = clientServices.filter((cs) => {
      const ncs = norm(cs)
      return normalizedProvServices.some((ps) => ps === ncs || ps.includes(ncs) || ncs.includes(ps))
    })
    const ratio = matches.length / clientServices.length
    serviceScore = Math.round(ratio * 15)
  } else {
    // No services requested — give neutral score
    serviceScore = 7
  }

  return Math.min(specScore + serviceScore, MAX_TYPE)
}

/**
 * Price range scoring (0-20 pts).
 *
 * Measures overlap between provider's [min_price, max_price] and client's
 * [budgetMin, budgetMax]. Full overlap = 20, no overlap = 0.
 * If either side is unspecified, return neutral 10.
 */
export function scorePriceRange(
  minPrice: number | null,
  maxPrice: number | null,
  budgetMin?: number,
  budgetMax?: number,
): number {
  // If client didn't specify budget, neutral score
  if (budgetMin == null && budgetMax == null) return 10
  // If provider has no pricing info, neutral score
  if (minPrice == null && maxPrice == null) return 10

  const pMin = minPrice ?? 0
  const pMax = maxPrice ?? Infinity
  const cMin = budgetMin ?? 0
  const cMax = budgetMax ?? Infinity

  // Both ranges are finite-ish — calculate overlap
  const overlapStart = Math.max(pMin, cMin)
  const overlapEnd = Math.min(pMax, cMax)

  if (overlapStart > overlapEnd) {
    // No overlap — score based on distance
    const gap = overlapStart - overlapEnd
    const refRange = Math.max((cMax === Infinity ? cMin * 2 : cMax) - cMin, 1)
    const penalty = Math.min(gap / refRange, 1)
    return Math.round(MAX_PRICE * (1 - penalty) * 0.5) // max 10 when no overlap
  }

  // There IS overlap — score by how well they match
  const clientRange = (cMax === Infinity ? Math.max(cMin * 3, pMax) : cMax) - cMin
  if (clientRange <= 0) {
    // Point budget — check if provider range contains it
    return pMin <= cMin && cMin <= pMax ? MAX_PRICE : 5
  }

  const overlapSize = overlapEnd - overlapStart
  const ratio = overlapSize / clientRange
  return Math.round(Math.min(ratio, 1) * MAX_PRICE)
}

/**
 * Geo distance scoring (0-15 pts).
 *  - Same city: 15
 *  - Same region: 10
 *  - Different / unknown: 5
 */
export function scoreGeoDistance(
  providerCity: string | null,
  providerRegion: string | null,
  clientCity?: string,
  clientRegion?: string,
): number {
  const norm = (s?: string | null) => (s ?? '').toLowerCase().trim()

  // If client doesn't care about location, neutral
  if (!clientCity && !clientRegion) return 10

  const pCity = norm(providerCity)
  const cCity = norm(clientCity)
  const pRegion = norm(providerRegion)
  const cRegion = norm(clientRegion)

  if (pCity && cCity && pCity === cCity) return MAX_GEO   // 15
  if (pRegion && cRegion && pRegion === cRegion) return 10
  return 5
}

/**
 * Rating scoring (0-20 pts).
 *
 * Linear scale: rating 5.0 = 20pts, 1.0 = 4pts.
 * No reviews = 10pts default (neutral).
 * Small review count penalty: < 3 reviews → score * 0.85
 */
export function scoreRating(avgRating: number | null, reviewCount: number): number {
  if (avgRating == null || reviewCount === 0) return 10

  // Linear mapping: 1.0 → 4pts, 5.0 → 20pts
  const score = Math.round((avgRating / 5) * MAX_RATING)
  const clamped = Math.max(0, Math.min(MAX_RATING, score))

  // Small penalty for very few reviews (less confidence)
  if (reviewCount < 3) return Math.round(clamped * 0.85)
  return clamped
}

/**
 * Availability scoring (0-15 pts).
 *  - accepting: 15
 *  - limited: 8
 *  - full: 0
 */
export function scoreAvailability(capacityStatus: string): number {
  switch (capacityStatus) {
    case 'accepting': return MAX_AVAIL // 15
    case 'limited':   return 8
    case 'full':      return 0
    default:          return 8 // unknown → treat as limited
  }
}

// ---------------------------------------------------------------------------
// Main matching function
// ---------------------------------------------------------------------------

/**
 * Find and score matching providers for given criteria.
 * Returns sorted results (best match first). Featured providers get +5 bonus.
 * Full-capacity providers are excluded unless no other matches exist.
 */
export async function findMatches(
  criteria: MatchCriteria,
  limit: number = 10,
): Promise<MatchResult[]> {
  // Fetch all verified providers
  const { data: providers, error: provError } = await supabaseAdmin
    .from('marketplace_providers')
    .select('id, name, city, region, specializations, services, min_price, max_price, capacity_status, featured')
    .eq('verified', true)

  if (provError) throw new Error(`Failed to fetch providers: ${provError.message}`)
  if (!providers || providers.length === 0) return []

  // Fetch aggregated reviews (avg rating + count per provider)
  const providerIds = providers.map((p) => p.id)
  const { data: reviews, error: revError } = await supabaseAdmin
    .from('marketplace_reviews')
    .select('provider_id, rating')
    .in('provider_id', providerIds)

  if (revError) throw new Error(`Failed to fetch reviews: ${revError.message}`)

  // Build rating map: provider_id → { avg, count }
  const ratingMap = new Map<string, { avg: number; count: number }>()
  if (reviews && reviews.length > 0) {
    const grouped = new Map<string, number[]>()
    for (const r of reviews) {
      const arr = grouped.get(r.provider_id) ?? []
      arr.push(r.rating)
      grouped.set(r.provider_id, arr)
    }
    for (const [pid, ratings] of grouped) {
      const sum = ratings.reduce((a, b) => a + b, 0)
      ratingMap.set(pid, { avg: sum / ratings.length, count: ratings.length })
    }
  }

  // Score each provider
  const results: MatchResult[] = providers.map((p) => {
    const ratingInfo = ratingMap.get(p.id)
    const avgRating = ratingInfo?.avg ?? null
    const reviewCount = ratingInfo?.count ?? 0

    const breakdown = {
      typeMatch: scoreTypeMatch(
        p.specializations ?? [],
        p.services ?? [],
        criteria.businessType,
        criteria.services,
      ),
      priceRange: scorePriceRange(
        p.min_price,
        p.max_price,
        criteria.budgetMin,
        criteria.budgetMax,
      ),
      geoDistance: scoreGeoDistance(
        p.city,
        p.region,
        criteria.city,
        criteria.region,
      ),
      rating: scoreRating(avgRating, reviewCount),
      availability: scoreAvailability(p.capacity_status ?? 'limited'),
    }

    const baseScore = breakdown.typeMatch
      + breakdown.priceRange
      + breakdown.geoDistance
      + breakdown.rating
      + breakdown.availability

    const totalScore = p.featured ? baseScore + FEATURED_BONUS : baseScore

    return {
      providerId: p.id,
      providerName: p.name,
      totalScore,
      breakdown,
      provider: {
        id: p.id,
        name: p.name,
        city: p.city ?? null,
        specializations: p.specializations ?? null,
        services: p.services ?? null,
        min_price: p.min_price ?? null,
        max_price: p.max_price ?? null,
        capacity_status: p.capacity_status ?? 'limited',
        avgRating,
        reviewCount,
      },
    }
  })

  // Sort descending by totalScore
  results.sort((a, b) => b.totalScore - a.totalScore)

  // Exclude full-capacity providers unless no other matches
  const available = results.filter((r) => r.provider.capacity_status !== 'full')
  const finalResults = available.length > 0 ? available : results

  return finalResults.slice(0, limit)
}
