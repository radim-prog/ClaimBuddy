'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ClosureSimpleView } from '@/components/client/closures/closure-simple-view'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { ArrowLeft, Loader2 } from 'lucide-react'

const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

export default function ClosureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const period = (params?.period as string) || ''
  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

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

  const [year, month] = period.split('-').map(Number)
  const monthName = monthNames[(month || 1) - 1] || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/client/closures')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">{monthName} {year}</h1>
      </div>

      {/* Simple-first view */}
      {summary && (
        <ClosureSimpleView
          summary={summary}
          tiers={tiers}
          unmatched={unmatched}
          companyId={companyId}
          period={period}
          monthName={monthName.toLowerCase()}
          year={year}
          onRefresh={fetchData}
          onUpload={() => router.push('/client/documents')}
        />
      )}
    </div>
  )
}
