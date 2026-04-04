'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FeatureGate } from '@/components/shared/feature-gate'
import { Button } from '@/components/ui/button'
import { ClosureTabs, ClosureTabContent } from '@/components/client/closures/closure-tabs'
import { ClosureSummaryTab } from '@/components/client/closures/closure-summary-tab'
import { ClosureBankTab } from '@/components/client/closures/closure-bank-tab'
import { ClosureDocumentsTab } from '@/components/client/closures/closure-documents-tab'
import { ClosureInvoicesTab } from '@/components/client/closures/closure-invoices-tab'
import { ClosureProgressBar } from '@/components/client/closures/closure-progress-bar'
import { ClosureToolbar } from '@/components/accountant/closures/closure-toolbar'
import { MatchingQualityCard } from '@/components/accountant/closures/matching-quality-card'
import { ArrowLeft, Loader2 } from 'lucide-react'

const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

interface SummaryData {
  period: string
  progress: number
  financials: { income: number; expense: number; cash_income: number; cash_expense: number; net: number }
  matching: { total: number; matched: number; auto_matched: number; manual_matched: number; suggested: number; unmatched: number; private: number; recurring: number }
  documents: { total: number; approved: number; pending: number }
  tax_impact: { income_tax: number; vat: number; social_insurance: number; health_insurance: number; total: number }
  actions: string[]
}

interface TiersData {
  auto: { transactions: any[]; count: number }
  suggestions: { transactions: any[]; count: number }
  unmatched: { transactions: any[]; count: number }
  private: { transactions: any[]; count: number }
}

interface UnmatchedData {
  expenses: { transactions: any[]; count: number; total_amount: number }
  income: { transactions: any[]; count: number; total_amount: number }
  tax_impact: { total: number }
}

export default function AccountantClientClosurePage() {
  const params = useParams()
  const router = useRouter()
  const companyId = (params?.companyId as string) || ''
  const period = (params?.period as string) || ''

  const [companyName, setCompanyName] = useState('')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [tiers, setTiers] = useState<TiersData | null>(null)
  const [unmatched, setUnmatched] = useState<UnmatchedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [closureStatus, setClosureStatus] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    if (!companyId || !period) return
    setLoading(true)

    Promise.all([
      fetch(`/api/client/closures/summary?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/transactions?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/unmatched?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([summaryData, tiersData, unmatchedData]) => {
        if (summaryData) {
          setSummary(summaryData)
          setCompanyName(summaryData.company_name || companyId)
        }
        if (tiersData?.tiers) setTiers(tiersData.tiers)
        if (unmatchedData) setUnmatched(unmatchedData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, period])

  useEffect(() => { fetchData() }, [fetchData])

  // Derive closure status from summary
  useEffect(() => {
    if (!summary) return
    if (summary.progress >= 100 && summary.actions.length === 0) setClosureStatus('complete')
    else if (summary.progress > 0) setClosureStatus('open')
    else setClosureStatus(null)
  }, [summary])

  const [year, month] = period.split('-').map(Number)
  const monthName = monthNames[(month || 1) - 1] || ''

  const handleApprove = async () => {
    const res = await fetch('/api/accountant/closures/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, period }),
    })
    if (res.ok) {
      setClosureStatus('approved')
      fetchData()
    }
  }

  const handleRemind = async () => {
    await fetch('/api/accountant/closures/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, period }),
    })
  }

  const handleRematch = async () => {
    const res = await fetch('/api/accountant/closures/rematch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, period }),
    })
    if (res.ok) fetchData()
  }

  const handleExport = async (type: 'bank' | 'cash' | 'all') => {
    const url = `/api/accountant/closures/export-pohoda?company_id=${companyId}&period=${period}&type=${type}`
    const res = await fetch(url)
    if (!res.ok) return

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('xml')) {
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `pohoda-${companyId}-${period}-${type}.xml`
      a.click()
      URL.revokeObjectURL(a.href)
    } else {
      const data = await res.json()
      for (const exp of data.exports || []) {
        const blob = new Blob([exp.xml], { type: 'application/xml' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `pohoda-${companyId}-${period}-${exp.type}.xml`
        a.click()
        URL.revokeObjectURL(a.href)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <FeatureGate feature="closures">
    <div className="space-y-5 max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/accountant/closures')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{companyName || companyId}</h1>
          <p className="text-sm text-muted-foreground">{monthName} {year}</p>
          {summary && (
            <ClosureProgressBar value={summary.progress} size="sm" className="mt-1 max-w-xs" />
          )}
        </div>
      </div>

      {/* Toolbar */}
      <ClosureToolbar
        companyId={companyId}
        companyName={companyName}
        period={period}
        status={closureStatus}
        onApprove={handleApprove}
        onRemind={handleRemind}
        onRematch={handleRematch}
        onExport={handleExport}
      />

      {/* Matching quality card */}
      {summary && (
        <MatchingQualityCard
          data={{
            auto: summary.matching.auto_matched,
            manual: summary.matching.manual_matched,
            suggested: summary.matching.suggested,
            unmatched: summary.matching.unmatched,
            private: summary.matching.private,
            total: summary.matching.total,
          }}
        />
      )}

      {/* Tab layout — reuse client closure tabs */}
      {summary && (
        <ClosureTabs>
          <ClosureTabContent value="overview">
            <ClosureSummaryTab data={summary} />
          </ClosureTabContent>

          <ClosureTabContent value="bank">
            {tiers ? (
              <ClosureBankTab
                tiers={tiers}
                companyId={companyId}
                period={period}
                onRefresh={fetchData}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">Žádné bankovní transakce</p>
            )}
          </ClosureTabContent>

          <ClosureTabContent value="documents">
            <ClosureDocumentsTab
              documents={summary.documents}
              unmatchedExpenses={unmatched?.expenses.transactions || []}
              totalTaxImpact={unmatched?.tax_impact.total || 0}
            />
          </ClosureTabContent>

          <ClosureTabContent value="invoices">
            <ClosureInvoicesTab
              matchedCount={summary.matching.auto_matched + summary.matching.manual_matched}
              unmatchedIncome={unmatched?.income.transactions || []}
              totalIncome={summary.financials.income}
            />
          </ClosureTabContent>
        </ClosureTabs>
      )}
    </div>
    </FeatureGate>
  )
}
