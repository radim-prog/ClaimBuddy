// Pricing settings utility functions
// Uses Supabase API with localStorage fallback for migration

export interface PricingSettings {
  hourlyRates: {
    standard: number
    expert: number
    urgent: number
    partner: number
  }
  travel: {
    type: 'fixed' | 'per-km' | 'both'
    fixedRate: number
    perKmRate: number
    minDistance: number
  }
  fees: {
    court: number
    administrative: number
    other: number
  }
  penalties: {
    latePayment: number
    missedDeadline: number
  }
}

export const defaultPricingSettings: PricingSettings = {
  hourlyRates: {
    standard: 800,
    expert: 1200,
    urgent: 1500,
    partner: 2000
  },
  travel: {
    type: 'per-km',
    fixedRate: 500,
    perKmRate: 12,
    minDistance: 10
  },
  fees: {
    court: 0,
    administrative: 0,
    other: 0
  },
  penalties: {
    latePayment: 0.05,
    missedDeadline: 0
  }
}

const STORAGE_KEY = 'accounting-pricing-settings'

/**
 * Get pricing settings from localStorage (sync, for SSR fallback)
 */
export function getPricingSettings(): PricingSettings {
  if (typeof window === 'undefined') return defaultPricingSettings

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultPricingSettings

    const parsed = JSON.parse(stored)
    return { ...defaultPricingSettings, ...parsed }
  } catch {
    return defaultPricingSettings
  }
}

/**
 * Fetch pricing settings from API (async, preferred)
 * Falls back to localStorage if API returns nothing, and seeds DB from localStorage
 */
export async function fetchPricingSettings(): Promise<PricingSettings> {
  try {
    const res = await fetch('/api/accountant/settings/pricing')
    if (res.ok) {
      const json = await res.json()
      if (json.settings) {
        return { ...defaultPricingSettings, ...json.settings }
      }
    }
  } catch {
    // API unavailable, fall back to localStorage
  }

  // If DB is empty, try localStorage and seed DB
  const localSettings = getPricingSettings()
  if (typeof window !== 'undefined') {
    const hasLocal = localStorage.getItem(STORAGE_KEY)
    if (hasLocal) {
      // Seed DB from localStorage
      try {
        await fetch('/api/accountant/settings/pricing', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localSettings),
        })
      } catch {
        // Ignore seed failure
      }
    }
  }

  return localSettings
}

/**
 * Save pricing settings to API (and localStorage as backup)
 */
export async function savePricingSettingsAsync(settings: PricingSettings): Promise<boolean> {
  // Always save to localStorage as backup
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }

  try {
    const res = await fetch('/api/accountant/settings/pricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Legacy: Save pricing settings to localStorage only
 */
export function savePricingSettings(settings: PricingSettings): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    console.error('Failed to save pricing settings to localStorage')
  }
}

/**
 * Get appropriate hourly rate based on work type
 */
export function getHourlyRateForWorkType(
  workType: 'standard' | 'expert' | 'urgent' | 'partner'
): number {
  const settings = getPricingSettings()
  return settings.hourlyRates[workType]
}

/**
 * Calculate travel cost based on distance
 */
export function calculateTravelCost(distanceKm: number): number {
  const settings = getPricingSettings()
  const { travel } = settings

  if (distanceKm < travel.minDistance) return 0

  switch (travel.type) {
    case 'fixed':
      return travel.fixedRate
    case 'per-km':
      return distanceKm * travel.perKmRate
    case 'both':
      return travel.fixedRate + (distanceKm * travel.perKmRate)
    default:
      return 0
  }
}

/**
 * Apply fee markup to a cost
 */
export function applyFeeMarkup(
  baseCost: number,
  feeType: 'court' | 'administrative' | 'other'
): number {
  const settings = getPricingSettings()
  const markupPercent = settings.fees[feeType]
  return baseCost * (1 + markupPercent / 100)
}

/**
 * Calculate late payment penalty
 */
export function calculateLatePaymentPenalty(
  amount: number,
  monthsLate: number
): number {
  const settings = getPricingSettings()
  return amount * settings.penalties.latePayment * monthsLate
}
