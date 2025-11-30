// Pricing settings utility functions
// Connects the pricing settings page to time tracking system

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
 * Get pricing settings from localStorage with fallback to defaults
 */
export function getPricingSettings(): PricingSettings {
  if (typeof window === 'undefined') return defaultPricingSettings

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultPricingSettings

    const parsed = JSON.parse(stored)
    return { ...defaultPricingSettings, ...parsed }
  } catch (error) {
    console.error('Failed to load pricing settings:', error)
    return defaultPricingSettings
  }
}

/**
 * Save pricing settings to localStorage
 */
export function savePricingSettings(settings: PricingSettings): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save pricing settings:', error)
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

  // Don't charge if under minimum distance
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
