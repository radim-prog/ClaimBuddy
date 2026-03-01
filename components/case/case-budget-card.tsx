'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, Wallet, TrendingUp, AlertCircle } from 'lucide-react'
import { CaseBudgetData } from '@/lib/types/project'

interface CaseBudgetCardProps {
  projectId: string
  readOnly?: boolean
  apiBasePath?: string
}

export function CaseBudgetCard({ projectId, readOnly = false, apiBasePath }: CaseBudgetCardProps) {
  const [budget, setBudget] = useState<CaseBudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = apiBasePath
      ? `${apiBasePath}/${projectId}/budget`
      : `/api/projects/${projectId}/budget`
    fetch(url)
      .then(r => r.json())
      .then(data => setBudget(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, apiBasePath])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)} h`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Načítání...</div>
        </CardContent>
      </Card>
    )
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Nepodařilo se načíst rozpočet</div>
        </CardContent>
      </Card>
    )
  }

  const invoicedPercentage = budget.estimated_revenue > 0
    ? Math.min(100, (budget.total_invoiced / budget.estimated_revenue) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{readOnly ? 'Přehled fakturace' : 'Rozpočet spisu'}</span>
          {!readOnly && budget.hourly_rate > 0 && (
            <Badge variant="outline">{formatCurrency(budget.hourly_rate)}/h</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid ${readOnly ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
          {!readOnly && (
            <>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Odpracováno</span>
                </div>
                <p className="text-lg font-semibold">{formatHours(budget.total_hours)}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Fakturovatelné</span>
                </div>
                <p className="text-lg font-semibold">{formatHours(budget.total_billable_hours)}</p>
              </div>
            </>
          )}

          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Vyfakturováno</span>
            </div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              {formatCurrency(budget.total_invoiced)}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${budget.remaining > 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className={`flex items-center gap-2 mb-1 ${budget.remaining > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Zbývá</span>
            </div>
            <p className={`text-lg font-semibold ${budget.remaining > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>
              {formatCurrency(budget.remaining)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fakturace</span>
            <span className="font-medium">{Math.round(invoicedPercentage)}%</span>
          </div>
          <Progress value={invoicedPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Odhad: {formatCurrency(budget.estimated_revenue)}</span>
            <span>Vyfakturováno: {formatCurrency(budget.total_invoiced)}</span>
          </div>
        </div>

        {budget.total_invoiced > budget.estimated_revenue && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              Vyfakturovaná částka překračuje odhad
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
