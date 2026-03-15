'use client'

import { useState, useEffect, useCallback } from 'react'

interface PlanFeatures {
  plan_tier: string
  portal_type: string
  features: Record<string, boolean>
  limits: {
    max_companies: number | null
    max_users: number | null
    max_extractions_month: number | null
  }
  subscription: {
    status: string
    trial_end: string | null
    current_period_end: string | null
  } | null
}

const CACHE_KEY = 'plan-features-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let memoryCache: { data: PlanFeatures; timestamp: number } | null = null

export function usePlanFeatures() {
  const [features, setFeatures] = useState<PlanFeatures | null>(memoryCache?.data ?? null)
  const [loading, setLoading] = useState(!memoryCache)

  const fetchFeatures = useCallback(async () => {
    // Check memory cache first
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
      setFeatures(memoryCache.data)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/subscription/features')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      memoryCache = { data, timestamp: Date.now() }
      setFeatures(data)
    } catch {
      // Fallback: monetization disabled or error — allow everything
      const fallback: PlanFeatures = {
        plan_tier: 'business',
        portal_type: 'accountant',
        features: {},
        limits: { max_companies: null, max_users: null, max_extractions_month: null },
        subscription: null,
      }
      setFeatures(fallback)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  const hasFeature = useCallback((feature: string): boolean => {
    if (!features) return true // Loading state: allow
    // If feature is not in the map, allow by default
    const value = features.features[feature]
    return value === undefined || value === true
  }, [features])

  const isLocked = useCallback((feature: string): boolean => {
    return !hasFeature(feature)
  }, [hasFeature])

  const refreshFeatures = useCallback(() => {
    memoryCache = null
    fetchFeatures()
  }, [fetchFeatures])

  return {
    planTier: features?.plan_tier ?? 'free',
    portalType: features?.portal_type ?? 'accountant',
    features: features?.features ?? {},
    limits: features?.limits ?? { max_companies: null, max_users: null, max_extractions_month: null },
    subscription: features?.subscription ?? null,
    hasFeature,
    isLocked,
    loading,
    refreshFeatures,
  }
}
