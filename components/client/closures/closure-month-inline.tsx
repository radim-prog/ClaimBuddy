'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClosureSimpleView } from './closure-simple-view'
import { Loader2 } from 'lucide-react'

interface ClosureMonthInlineProps {
  companyId: string
  companies: Array<{ id: string; name: string }>
  period: string
  monthName: string
  year: number
}

export function ClosureMonthInline({ companyId, companies, period, monthName, year }: ClosureMonthInlineProps) {
  const [summary, setSummary] = useState<any>(null)
  const [tiers, setTiers] = useState<any>(null)
  const [unmatched, setUnmatched] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    if (!companyId || !period) return
    setLoading(true)
    Promise.all([
      fetch(`/api/client/closures/summary?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/transactions?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/unmatched?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([s, t, u]) => {
        if (s) setSummary(s)
        if (t?.tiers) setTiers(t.tiers)
        if (u) setUnmatched(u)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, period])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!summary) {
    return <p className="text-center text-sm text-muted-foreground py-6">Nepodařilo se načíst data</p>
  }

  return (
    <ClosureSimpleView
      summary={summary}
      tiers={tiers}
      unmatched={unmatched}
      companyId={companyId}
      companies={companies}
      period={period}
      monthName={monthName.toLowerCase()}
      year={year}
      onRefresh={fetchData}
    />
  )
}
