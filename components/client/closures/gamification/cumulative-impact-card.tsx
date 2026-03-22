'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaxImpactBreakdown } from '@/components/client/closures/tax-impact-inline'
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CumulativeImpactCardProps {
  income_tax: number
  vat: number
  social_insurance: number
  health_insurance: number
  total: number
  unmatchedCount: number
  matchedCount: number
  totalDocuments: number
  className?: string
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ')

export function CumulativeImpactCard({
  income_tax, vat, social_insurance, health_insurance, total,
  unmatchedCount, matchedCount, totalDocuments,
  className,
}: CumulativeImpactCardProps) {
  const hasImpact = total > 0
  const allMatched = unmatchedCount === 0 && totalDocuments > 0

  return (
    <Card className={cn(
      hasImpact
        ? 'border-red-200 dark:border-red-800'
        : allMatched
        ? 'border-green-200 dark:border-green-800'
        : '',
      className,
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {hasImpact ? (
            <>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                Chybějící doklady vás stojí {fmtCZK(total)} Kč
              </span>
            </>
          ) : allMatched ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">
                Všechny doklady jsou v pořádku
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>Daňový dopad</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasImpact && (
          <>
            <TaxImpactBreakdown
              income_tax={income_tax}
              vat={vat}
              social_insurance={social_insurance}
              health_insurance={health_insurance}
              total={total}
            />

            {/* Motivational message */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-xs">
              {unmatchedCount === 1 ? (
                <p>Zbývá <strong>1 nespárovaný doklad</strong>. Doplňte ho a ušetříte {fmtCZK(total)} Kč na daních.</p>
              ) : unmatchedCount <= 5 ? (
                <p>Zbývá jen <strong>{unmatchedCount} nespárovaných dokladů</strong>. Jste téměř hotovi!</p>
              ) : (
                <p><strong>{unmatchedCount} nespárovaných dokladů</strong> zvyšuje vaši daňovou povinnost o {fmtCZK(total)} Kč. Každý doplněný doklad pomáhá.</p>
              )}
            </div>
          </>
        )}

        {allMatched && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-xs">
            <p>Skvělá práce! Všech <strong>{matchedCount}</strong> dokladů je spárováno. Vaše daňová povinnost je optimální.</p>
          </div>
        )}

        {!hasImpact && !allMatched && totalDocuments === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Zatím žádné transakce k vyhodnocení
          </p>
        )}
      </CardContent>
    </Card>
  )
}
