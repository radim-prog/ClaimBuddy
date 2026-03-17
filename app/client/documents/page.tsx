'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Camera,
  FileText,
  Landmark,
  Receipt,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { DocumentComments } from '@/components/documents/document-comments'
import { BankStatementUpload } from '@/components/client/bank-statement-upload'
import { TransactionList, type BankTransaction } from '@/components/client/transaction-list'
import { TransactionMatchDialog } from '@/components/client/transaction-match-dialog'
import { TaxImpactSummary } from '@/components/client/tax-impact-summary'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { CollapsibleSection } from '@/components/collapsible-section'
import { BankReviewSheet } from '@/components/client/bank-review-sheet'
import { TransactionQuickUpload } from '@/components/client/transaction-quick-upload'
import { UpsellBanner } from '@/components/client/upsell-banner'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <DocumentsPageInner />
    </Suspense>
  )
}

function DocumentsPageInner() {
  const [showScanOverlay, setShowScanOverlay] = useState(false)
  const [bankExpanded, setBankExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('documents-bank-expanded') === 'true'
    }
    return false
  })

  const toggleBank = useCallback(() => {
    setBankExpanded(prev => {
      const next = !prev
      localStorage.setItem('documents-bank-expanded', String(next))
      return next
    })
  }, [])

  const { companies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || companies[0]?.id || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Doklady</h1>
        <p className="text-muted-foreground">Nahrajte doklady a spravujte bankovní výpisy</p>
      </div>

      <UpsellBanner message="Nahráváte doklady sami? S profesionální účetní ušetříte čas a vyhnete se chybám." />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanOverlay(true)}
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
        >
          <Camera className="h-5 w-5 flex-shrink-0" />
          Nahrát doklad
        </button>
        <a
          href="/client/invoices"
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-base rounded-xl transition-colors"
        >
          <Receipt className="h-5 w-5 flex-shrink-0" />
          Přejít na faktury
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </a>
      </div>

      {/* Document list - always visible */}
      <DocumentListTab />

      {/* Bank section - prominent with callout */}
      {!bankExpanded && (
        <button
          onClick={toggleBank}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
        >
          <Landmark className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Bankovní výpisy</span>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70 ml-2">Nahrávejte výpisy a párujte transakce</span>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-400" />
        </button>
      )}
      <CollapsibleSection
        id="documents-bank"
        label="Bankovní výpisy"
        icon={Landmark}
        expanded={bankExpanded}
        onToggle={toggleBank}
        variant="bordered"
      >
        <BankTab />
      </CollapsibleSection>

      {/* Overlays */}
      <ScanOverlay
        open={showScanOverlay}
        companyId={companyId}
        companies={companies}
        onClose={() => setShowScanOverlay(false)}
      />
    </div>
  )
}


interface Document {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  ocr_status?: string
  uploaded_at: string
  storage_path: string | null
}

const typeLabels: Record<string, { label: string; icon: typeof FileText }> = {
  bank_statement: { label: 'Výpis z banky', icon: Landmark },
  expense_invoice: { label: 'Nákladový doklad', icon: Receipt },
  income_invoice: { label: 'Příjmová faktura', icon: FileText },
  invoice: { label: 'Faktura', icon: Receipt },
  receipt: { label: 'Účtenka', icon: Receipt },
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const statusLabels: Record<string, string> = {
  uploaded: 'Nahráno',
  uploaded_only: 'Čeká na zpracování',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  pending: 'Čeká',
  draft: 'Nepotvrzeno',
  submitted: 'Odesláno',
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ListFilter = 'all' | 'draft' | 'submitted' | 'approved'

function DocumentListTab() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const { filters: urlFilters, setFilter: setUrlParam } = useUrlFilters({ filter: 'all' })
  const filter = urlFilters.filter as ListFilter

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const filtered = documents.filter(doc => {
    if (filter === 'all') return true
    const docStatus = doc.ocr_status || doc.status
    return docStatus === filter
  })

  const draftCount = documents.filter(d => (d.ocr_status || d.status) === 'draft').length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'submitted', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setUrlParam('filter', f)}
            className={cn(
              'filter-pill',
              filter === f ? 'filter-pill-active' : 'filter-pill-inactive'
            )}
          >
            {f === 'all' ? 'Vše' : f === 'draft' ? `Nepotvrzeno (${draftCount})` : f === 'submitted' ? 'Odesláno' : 'Schváleno'}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={fetchDocs} className="ml-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading && documents.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné dokumenty</p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(doc => {
            const typeInfo = typeLabels[doc.type] || { label: doc.type, icon: FileText }
            const Icon = typeInfo.icon
            const isSelected = selectedDoc?.id === doc.id
            const docStatus = doc.ocr_status || doc.status

            return (
              <Card
                key={doc.id}
                className={cn(
                  'rounded-2xl cursor-pointer transition-colors',
                  isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50',
                  docStatus === 'draft' && 'border-amber-300 dark:border-amber-700'
                )}
                onClick={() => setSelectedDoc(isSelected ? null : doc)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeInfo.label}</span>
                        {doc.period && <><span>·</span><span>{doc.period}</span></>}
                        {doc.file_size_bytes > 0 && <><span>·</span><span>{formatSize(doc.file_size_bytes)}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {doc.storage_path && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Náhled"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/documents/${doc.id}/download`)
                              if (res.ok) {
                                const data = await res.json()
                                const a = document.createElement('a')
                                a.href = data.url
                                a.download = data.file_name || doc.file_name
                                a.click()
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Stáhnout"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <Badge className={cn('rounded-md', statusColors[docStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300')}>
                        {statusLabels[docStatus] || docStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(doc.uploaded_at).toLocaleDateString('cs-CZ')}
                      </span>
                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
                    </div>
                  </div>
                </CardContent>

                {isSelected && (
                  <div className="px-4 pb-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <div className="pt-4">
                      <DocumentComments documentId={doc.id} userRole="client" />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== BANK TAB =====

function BankTab() {
  const { companies, loading: companiesLoading } = useClientUser()
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

  // Fetch match summary when transactions change
  const fetchMatchSummary = useCallback(async () => {
    if (!selectedCompany || transactions.length === 0) { setMatchSummary(null); return }
    // Derive period from first transaction
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
      toast.error('Přiřazení selhalo')
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
      toast.error('Změna kategorie selhala')
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
      toast.error('Auto-párování selhalo')
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

      {/* Match summary bar */}
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

// ===== MATCH SUMMARY BAR =====

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
