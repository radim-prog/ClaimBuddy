'use client'

import { ReactNode } from 'react'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { UpgradeBanner } from '@/components/upgrade-banner'

interface PlanGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  inline?: boolean // When true, shows inline upgrade prompt instead of full banner
}

export function PlanGate({ feature, children, fallback, inline }: PlanGateProps) {
  const { hasFeature, loading, planTier } = usePlanFeatures()

  if (loading) return <>{children}</>
  if (hasFeature(feature)) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return <UpgradeBanner feature={feature} currentTier={planTier} inline={inline} />
}
