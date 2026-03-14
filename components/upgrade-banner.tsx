'use client'

import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const FEATURE_LABELS: Record<string, { name: string; tier: string }> = {
  messages: { name: 'Komunikace', tier: 'Starter' },
  closures: { name: 'Uzávěrky', tier: 'Starter' },
  vat: { name: 'DPH přehledy', tier: 'Starter' },
  income_tax: { name: 'Daň z příjmu', tier: 'Professional' },
  client_groups: { name: 'Skupiny klientů', tier: 'Professional' },
  projects: { name: 'Projekty', tier: 'Professional' },
  client_invoicing: { name: 'Klientská fakturace', tier: 'Professional' },
  extraction: { name: 'Vytěžování dokumentů', tier: 'Enterprise' },
  full_cases: { name: 'Případy', tier: 'Enterprise' },
  analytics: { name: 'Analytika', tier: 'Enterprise' },
  address_book: { name: 'Adresář partnerů', tier: 'Basic' },
  travel_randomizer: { name: 'AI Cestovní deník', tier: 'Premium' },
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  basic: 'Basic',
  premium: 'Premium',
}

interface UpgradeBannerProps {
  feature: string
  currentTier?: string
  inline?: boolean
  portalType?: 'accountant' | 'client'
}

export function UpgradeBanner({ feature, currentTier, inline, portalType = 'accountant' }: UpgradeBannerProps) {
  const featureInfo = FEATURE_LABELS[feature]
  const featureName = featureInfo?.name ?? feature
  const requiredTier = featureInfo?.tier ?? 'vyšší tarif'
  const subscriptionUrl = portalType === 'client'
    ? '/client/subscription'
    : '/accountant/admin/subscription'

  if (inline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-amber-800 dark:text-amber-200">
          {featureName} vyžaduje tarif <strong>{requiredTier}</strong>
        </span>
        <Link href={subscriptionUrl} className="ml-auto">
          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300">
            Upgrade
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardContent className="py-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {featureName}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          Tato funkce vyžaduje tarif <strong className="text-purple-600 dark:text-purple-400">{requiredTier}</strong>
        </p>
        {currentTier && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Aktuálně: {TIER_LABELS[currentTier] || currentTier}
          </p>
        )}
        <Link href={subscriptionUrl}>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Zobrazit tarify
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
