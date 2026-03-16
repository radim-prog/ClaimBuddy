'use client'

import { Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FeatureLockedIndicatorProps {
  requiredTier?: string
  currentTier?: string
  reason?: string
}

export function FeatureLockedIndicator({
  requiredTier,
  currentTier,
  reason,
}: FeatureLockedIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Funkce uzamčena
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-1">
        {reason || `Tato funkce vyžaduje tarif ${requiredTier || 'vyšší'}.`}
      </p>

      {currentTier && requiredTier && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
          Váš tarif: <span className="font-medium">{currentTier}</span>
          {' → '}
          Požadovaný: <span className="font-medium text-amber-600 dark:text-amber-400">{requiredTier}</span>
        </p>
      )}

      {!currentTier && !requiredTier && <div className="mb-6" />}

      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Zobrazit tarify
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
