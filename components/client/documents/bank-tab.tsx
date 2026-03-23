'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { BankStatementUpload } from '@/components/client/bank-statement-upload'
import { TransactionList, type BankTransaction } from '@/components/client/transaction-list'
import { TransactionMatchDialog } from '@/components/client/transaction-match-dialog'
import { TaxImpactSummary } from '@/components/client/tax-impact-summary'
import { BankReviewSheet } from '@/components/client/bank-review-sheet'
import { TransactionQuickUpload } from '@/components/client/transaction-quick-upload'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'
import { toast } from 'sonner'

function MatchSummaryBar({ summary }: {
  summary: {
    total_transactions: number
    income: { total: number; matched: number; unmatched: number }
    expense: { total: number; matched: number; unmatched: number; private_or_deposit: number }
    total_tax_impact: number
    total_vat_impact: number
  }
}) {
  const totalMatched = summary.income.matched + summary.expense.matched
  const totalUnmatched = summary.expense.unmatched
  const totalPrivate = summary.expense.private_or_deposit
  const total = summary.total_transactions
  const pctMatched = total > 0 ? Math.round((totalMatched / total) * 100) : 0
  const pctUnmatched = total > 0 ? Math.round((totalUnmatched / total) * 100) : 0
  const pctPrivate = total > 0 ? Math.round((totalPrivate / total) * 100) : 0
  const allDone = totalUnmatched === 0

  return (
    <Card className={cn('rounded-2xl', allDone ? 'border-green-200 dark:border-green-900' : 'border-amber-200 dark:border-amber-800')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{total} transakcí</span>
          <span className="text-sm font-bold">
            {allDone ? (
              <span className="text-green-600">Vše napárováno</span>
            ) : (
              <span>{pctMatched}%</span>
            )}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
          <div className="bg-green-500 h-full transition-all" style={{ width: `${pctMatched}%` }} />
          <div className="bg-red-500 h-full transition-all" style={{ width: `${pctUnmatched}%` }} />
          <div className="bg-gray-300 dark:bg-gray-600 h-full transition-all" style={{ width: `${pctPrivate}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {totalMatched} spárováno
          </span>
          {totalUnmatched > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {totalUnmatched} chybí doklad
            </span>
          )}
          {totalPrivate > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              {totalPrivate} soukromé
            </span>
          )}
        </div>
        {totalUnmatched > 0 && (summary.total_tax_impact > 0 || summary.total_vat_impact > 0) && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            Dopad chybějících: {(summary.total_tax_impact + summary.total_vat_impact).toLocaleString('cs-CZ')} Kč
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function BankTab() {
  const { visibleCompanies: companies, loading: companiesLoading } = useClientUser()
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [matchingTx, setMatchingTx] = useState<BankTransaction | null>(null)
  const { filters: bankUrlFilters, setFilter: setBankUrlParam } = useUrlFilters({ bankFilter: 'all' })
  const filter = bankUrlFilters.bankFilter as 'all' | 'unmatched' | 'matched'
  const [autoMatching, setAutoMatching] = useState(false)
  const [reviewPeriod, setReviewPeriod] = useState<string | null>(null)
  const [reviewTransactions, setReviewTransactions] = useState<BankTransaction[]>([])
  const [loadingReview, setLoadingReview] = useState(false)
  const [quickUploadTx, setQuickUploadTx] = useState<BankTransaction | null>(null)
  const [matchSummary, setMatchSummary] = useState<{
    total_transactions: number
    income: { total: number; matched: number; unmatched: number }
    expense: { total: number; matched: number; unmatched: number; private_or_deposit: number }
    total_tax_impact: number
    total_vat_impact: number
  } | null>(null)

  useEffect(() => {
    if (companies.length === 1 && !selectedCompany) {
      setSelectedCompany(companies[0].id)
    }
  }, [companies, selectedCompany])

  const fetchTransactions = useCallback(async () => {
    if (!selectedCompany) return
    setLoading(true)
    try {
      const matchedParam = filter === 'unmatched' ? '&matched=false' : filter === 'matched' ? '&matched=true' : ''
      const res = await fetch(`/api/client/bank-transactions?company_id=${selectedCompany}${matchedParam}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, filter])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const fetchMatchSummary = useCallback(async () => {
    if (!selectedCompany || transactions.length === 0) { setMatchSummary(null); return }
    const period = transactions[0]?.transaction_date?.substring(0, 7)
    if (!period) return
    try {
      const res = await fetch(`/api/client/bank-transactions/match-summary?company_id=${selectedCompany}&period=${period}`)
      if (res.ok) setMatchSummary(await res.json())
    } catch { /* ignore */ }
  }, [selectedCompany, transactions])

  useEffect(() => { fetchMatchSummary() }, [fetchMatchSummary])

  const handleMatch = async (transactionId: string, documentId: string | null, invoiceId: string | null) => {
    try {
      const res = await fetch(`/api/client/bank-transactions/${transactionId}/match`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matched_document_id: documentId,
          matched_invoice_id: invoiceId,
        }),
      })
      if (res.ok) {
        toast.success(documentId || invoiceId ? 'Doklad přiřazen' : 'Přiřazení zrušeno')
        fetchTransactions()
      }
    } catch {
      toast.error('Přiřazení se nezdařilo')
    }
    setMatchingTx(null)
  }

  const handleCategoryChange = async (transactionId: string, category: string) => {
    try {
      await fetch(`/api/client/bank-transactions/${transactionId}/match`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, category } : t))
    } catch {
      toast.error('Změna kategorie se nezdařila')
    }
  }

  const handleExtracted = async (period: string) => {
    if (!selectedCompany) return
    setLoadingReview(true)
    try {
      const res = await fetch(`/api/client/bank-transactions?company_id=${selectedCompany}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setReviewTransactions(data.transactions || [])
        setReviewPeriod(period)
      }
    } finally {
      setLoadingReview(false)
    }
  }

  const handleAutoMatch = async () => {
    if (!selectedCompany) return
    setAutoMatching(true)
    try {
      const res = await fetch('/api/client/bank-transactions/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Spárováno ${data.matched} transakcí`)
        fetchTransactions()
      }
    } catch {
      toast.error('Auto-párování se nezdařilo')
    } finally {
      setAutoMatching(false)
    }
  }

  if (companiesLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-4">
      {companies.length > 1 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <Label className="mb-2 block">Firma</Label>
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
            >
              <option value="">Vyberte firmu...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </CardContent>
        </Card>
      )}

      {selectedCompany && <TaxImpactSummary companyId={selectedCompany} />}

      {selectedCompany && (
        <BankStatementUpload companyId={selectedCompany} onUploadComplete={() => fetchTransactions()} onExtracted={handleExtracted} />
      )}

      {matchSummary && matchSummary.total_transactions > 0 && (
        <MatchSummaryBar summary={matchSummary} />
      )}

      {transactions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'unmatched', 'matched'] as const).map(f => (
            <button
              key={f}
              onClick={() => setBankUrlParam('bankFilter', f)}
              className={cn(
                'filter-pill',
                filter === f ? 'filter-pill-active' : 'filter-pill-inactive'
              )}
            >
              {f === 'all' ? 'Vše' : f === 'unmatched' ? 'Nespárované' : 'Spárované'}
            </button>
          ))}
          <Button variant="outline" size="sm" className="ml-auto" onClick={handleAutoMatch} disabled={autoMatching}>
            {autoMatching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Auto-párování
          </Button>
        </div>
      )}

      <TransactionList
        transactions={transactions}
        loading={loading}
        onMatchClick={setMatchingTx}
        onCategoryChange={handleCategoryChange}
        onQuickUpload={setQuickUploadTx}
      />

      {matchingTx && selectedCompany && (
        <TransactionMatchDialog
          transaction={matchingTx}
          companyId={selectedCompany}
          onMatch={handleMatch}
          onClose={() => setMatchingTx(null)}
        />
      )}

      {quickUploadTx && selectedCompany && (
        <TransactionQuickUpload
          transaction={quickUploadTx}
          companyId={selectedCompany}
          onUploaded={() => {
            setQuickUploadTx(null)
            fetchTransactions()
            fetchMatchSummary()
          }}
          onClose={() => setQuickUploadTx(null)}
        />
      )}

      {reviewPeriod && reviewTransactions.length > 0 && selectedCompany && (
        <BankReviewSheet
          transactions={reviewTransactions}
          companyId={selectedCompany}
          period={reviewPeriod}
          legalForm={companies.find(c => c.id === selectedCompany)?.legal_form}
          onConfirmed={() => {
            setReviewPeriod(null)
            setReviewTransactions([])
            fetchTransactions()
          }}
          onClose={() => {
            setReviewPeriod(null)
            setReviewTransactions([])
          }}
        />
      )}
    </div>
  )
}
