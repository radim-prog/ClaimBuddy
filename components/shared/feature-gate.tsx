'use client'

import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import Link from 'next/link'

const FEATURE_LABELS: Record<string, string> = {
  closures: 'Uzávěrky',
  vat: 'DPH matice',
  messages: 'Zprávy a komunikace',
  income_tax: 'Daň z příjmu',
  analytics: 'Analytika',
  extraction: 'Vytěžování dokladů',
  projects: 'Projekty',
  client_invoicing: 'Fakturace klientů',
  full_cases: 'Správa případů',
  trash_restore: 'Koš',
}

export function FeatureGate({
  feature,
  children,
}: {
  feature: string
  children: React.ReactNode
}) {
  const { isLocked, loading } = usePlanFeatures()

  if (loading) return null

  if (isLocked(feature)) {
    const label = FEATURE_LABELS[feature] || feature
    return (
      <div className="text-center py-16">
        <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{label} — vyšší tarif potřeba</h2>
        <p className="text-muted-foreground mb-4">
          Tato funkce vyžaduje vyšší tarif. Upgradujte pro přístup.
        </p>
        <Button variant="outline" asChild>
          <Link href="/pricing">Zobrazit tarify</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
