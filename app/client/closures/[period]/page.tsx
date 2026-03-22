'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClosureTabs, ClosureTabContent } from '@/components/client/closures/closure-tabs'
import { ClosureSummaryTab } from '@/components/client/closures/closure-summary-tab'
import { ClosureBankTab } from '@/components/client/closures/closure-bank-tab'
import { ClosureDocumentsTab } from '@/components/client/closures/closure-documents-tab'
import { ClosureInvoicesTab } from '@/components/client/closures/closure-invoices-tab'
import { ClosureProgressBar } from '@/components/client/closures/closure-progress-bar'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { cn } from '@/lib/utils'
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

export default function ClosureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const period = (params?.period as string) || ''
  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [tiers, setTiers] = useState<TiersData | null>(null)
  const [unmatched, setUnmatched] = useState<UnmatchedData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    if (!companyId || !period) return
    setLoading(true)

    Promise.all([
      fetch(`/api/client/closures/summary?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/transactions?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/client/closures/unmatched?company_id=${companyId}&period=${period}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([summaryData, tiersData, unmatchedData]) => {
        if (summaryData) setSummary(summaryData)
        if (tiersData?.tiers) setTiers(tiersData.tiers)
        if (unmatchedData) setUnmatched(unmatchedData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, period])

  useEffect(() => { fetchData() }, [fetchData])

  const [year, month] = period.split('-').map(Number)
  const monthName = monthNames[(month || 1) - 1] || ''

  const statusLabel = !summary ? '' :
    summary.progress >= 100 && summary.actions.length === 0 ? 'Kompletní' :
    summary.progress > 0 ? 'Rozpracováno' : 'Otevřeno'

  const statusColor =
    statusLabel === 'Kompletní' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    statusLabel === 'Rozpracováno' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'

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
        <div className="flex-1">
          <h1 className="text-xl font-bold">{monthName} {year}</h1>
          {summary && (
            <ClosureProgressBar value={summary.progress} size="sm" className="mt-1 max-w-xs" />
          )}
        </div>
        {summary && <Badge className={cn('rounded-md', statusColor)}>{statusLabel}</Badge>}
      </div>

      {/* Tab-based layout */}
      {summary && (
        <ClosureTabs>
          <ClosureTabContent value="overview">
            <ClosureSummaryTab
              data={summary}
              onAction={(action) => {
                if (action === 'upload_bank_statement') router.push('/client/bank')
                if (action === 'review_documents') router.push('/client/documents')
              }}
            />
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
              onUpload={() => router.push('/client/documents')}
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
  )
}
