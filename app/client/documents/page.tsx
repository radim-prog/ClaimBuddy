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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <DocumentsPageInner />
    </Suspense>
  )
}

function DocumentsPageInner() {
  const router = useRouter()
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

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanOverlay(true)}
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
        >
          <Camera className="h-5 w-5 flex-shrink-0" />
          Nahrát doklad
        </button>
        <button
          onClick={() => router.push('/client/invoices')}
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base"
        >
          <Receipt className="h-5 w-5 flex-shrink-0" />
          Vystavit fakturu
        </button>
      </div>

      {/* Document list - always visible */}
      <DocumentListTab />

      {/* Bank section - collapsible */}
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
  const [filter, setFilter] = useState<ListFilter>('all')

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
            onClick={() => setFilter(f)}
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
                      <Badge className={cn('rounded-md', statusColors[docStatus] || 'bg-gray-100 text-gray-800')}>
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
  const [filter, setFilter] = useState<'all' | 'unmatched' | 'matched'>('all')
  const [autoMatching, setAutoMatching] = useState(false)

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
        <BankStatementUpload companyId={selectedCompany} onUploadComplete={() => fetchTransactions()} />
      )}

      {transactions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'unmatched', 'matched'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
      />

      {matchingTx && selectedCompany && (
        <TransactionMatchDialog
          transaction={matchingTx}
          companyId={selectedCompany}
          onMatch={handleMatch}
          onClose={() => setMatchingTx(null)}
        />
      )}
    </div>
  )
}
