'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  RotateCcw,
  Loader2,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  BookOpen,
  Check,
  X,
  Pencil,
  Download,
  Eye,
  Clock,
  AlertTriangle,
  Code,
  Copy,
} from 'lucide-react'
import type { ExtractionStep } from '@/lib/extraction-types'
import { STEP_LABELS, STEP_ESTIMATES } from '@/lib/extraction-types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { DocumentRegisterEntry, DocumentType } from '@/lib/types/document-register'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS, isExtractableType } from '@/lib/types/document-register'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentComments } from '@/components/documents/document-comments'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { toast } from 'sonner'

type JournalEntry = {
  id: string
  line_number: number
  description: string
  amount: number
  vat_amount: number
  debit_account: string
  debit_name?: string
  credit_account: string
  credit_name?: string
  vat_account: string | null
  confidence: number | null
  rule_id: string | null
  status: string
}

type QueueJobInfo = {
  documentId: string
  currentStep: ExtractionStep
  stepStartedAt?: number
  steps: Array<{ step: ExtractionStep; startedAt: number; completedAt?: number }>
  status: string
}

type AccountEntry = {
  account_number: string
  account_name: string
}

interface DocumentDetailPanelProps {
  document: DocumentRegisterEntry
  companyId: string
  onExtract: (id: string) => void
  extractionJob?: QueueJobInfo
  onDocumentUpdated?: () => void
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const color = score >= 85 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
    score >= 60 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
    'text-red-600 bg-red-50 dark:bg-red-900/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {score}%
    </span>
  )
}

const PIPELINE_STEPS: ExtractionStep[] = ['downloading', 'ocr', 'ai_extraction', 'ai_verification', 'saving']

export function DocumentDetailPanel({ document: doc, companyId, onExtract, extractionJob, onDocumentUpdated }: DocumentDetailPanelProps) {
  const { userId } = useAccountantUser()
  const [extracting, setExtracting] = useState(false)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingPredkontace, setLoadingPredkontace] = useState(false)
  const [showPredkontace, setShowPredkontace] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ debit_account: string; credit_account: string; amount: number; vat_amount: number }>({ debit_account: '', credit_account: '', amount: 0, vat_amount: 0 })
  const [editingName, setEditingName] = useState(false)
  const [newFileName, setNewFileName] = useState(doc.file_name)
  const [accountsMap, setAccountsMap] = useState<Map<string, string>>(new Map())
  const [inlineEditAccount, setInlineEditAccount] = useState<{ entryId: string; field: 'debit' | 'credit' } | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState('')

  useEffect(() => {
    setEditingName(false)
    setNewFileName(doc.file_name)
  }, [doc.id, doc.file_name])

  // Auto-load existing predkontace entries, or auto-generate after extraction
  useEffect(() => {
    if (!doc.ocr_processed) return
    const load = async () => {
      try {
        const res = await fetch(`/api/documents/predkontace?document_id=${doc.id}`)
        if (res.ok) {
          const data = await res.json()
          const entries = data.entries || []
          if (entries.length > 0) {
            setJournalEntries(entries)
            setShowPredkontace(true)
          } else {
            // No entries yet — auto-generate
            autoGenerate()
          }
        }
      } catch { /* ignore */ }
    }
    const autoGenerate = async () => {
      setLoadingPredkontace(true)
      setShowPredkontace(true)
      try {
        const res = await fetch('/api/documents/predkontace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: doc.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setJournalEntries(data.suggested_entries || [])
        }
      } catch { /* ignore */ }
      setLoadingPredkontace(false)
    }
    load()
  }, [doc.id, doc.ocr_processed])

  // Load chart of accounts map once
  useEffect(() => {
    if (accountsMap.size > 0) return
    const load = async () => {
      try {
        const res = await fetch('/api/documents/predkontace/accounts')
        if (res.ok) {
          const data = await res.json()
          const map = new Map<string, string>()
          for (const acc of (data.accounts || [])) {
            map.set(acc.account_number, acc.account_name)
          }
          setAccountsMap(map)
        }
      } catch { /* ignore */ }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRename = async () => {
    if (!newFileName.trim() || newFileName.trim() === doc.file_name) {
      setEditingName(false)
      return
    }
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ document_id: doc.id, file_name: newFileName.trim() }),
      })
      if (res.ok) {
        toast.success('Název dokladu upraven')
        setEditingName(false)
        onDocumentUpdated?.()
      } else {
        toast.error('Chyba při změně názvu')
      }
    } catch {
      toast.error('Chyba při změně názvu')
    }
  }

  const extractable = isExtractableType(doc.type as DocumentType)
  const numPages = (doc.ocr_data as Record<string, unknown> | null)?.num_pages as number | undefined

  const handleTypeChange = async (newType: string) => {
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ document_id: doc.id, type: newType }),
      })
      if (res.ok) {
        toast.success('Typ dokladu upraven')
        onDocumentUpdated?.()
      } else {
        toast.error('Chyba při změně typu')
      }
    } catch {
      toast.error('Chyba při změně typu')
    }
  }

  const ocrData = doc.ocr_data as Record<string, unknown> | null
  const supplier = ocrData?.supplier as Record<string, unknown> | undefined
  const items = ocrData?.items as Array<Record<string, unknown>> | undefined

  // Check if supplier has any non-empty values
  const hasSupplierData = supplier && Object.values(supplier).some(v => v != null && v !== '')
  // Check if amounts have any values
  const hasAmounts = doc.total_without_vat !== null || doc.total_vat !== null || doc.total_with_vat !== null

  const handleExtract = async () => {
    setExtracting(true)
    try {
      await onExtract(doc.id)
    } finally {
      setExtracting(false)
    }
  }

  const handleSaveEntry = async (entryId: string) => {
    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({
          entry_id: entryId,
          debit_account: editValues.debit_account,
          credit_account: editValues.credit_account,
          amount: editValues.amount,
          vat_amount: editValues.vat_amount,
        }),
      })
      if (res.ok) {
        setJournalEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, ...editValues, status: 'modified' } : e
        ))
        setEditingEntryId(null)
        toast.success('Předkontace upravena')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
  }

  const handleInlineAccountSave = async (entryId: string, field: 'debit' | 'credit') => {
    const accountField = field === 'debit' ? 'debit_account' : 'credit_account'
    const entry = journalEntries.find(e => e.id === entryId)
    if (!entry) return

    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({
          entry_id: entryId,
          [accountField]: inlineEditValue,
          ...(field === 'debit' ? { credit_account: entry.credit_account } : { debit_account: entry.debit_account }),
          amount: entry.amount,
          vat_amount: entry.vat_amount,
        }),
      })
      if (res.ok) {
        const accountName = accountsMap.get(inlineEditValue) || ''
        setJournalEntries(prev => prev.map(e =>
          e.id === entryId ? {
            ...e,
            [accountField]: inlineEditValue,
            [`${field}_name`]: accountName,
            status: 'modified',
          } : e
        ))
        setInlineEditAccount(null)
        toast.success('Účet upraven')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
  }

  const handleGeneratePredkontace = async () => {
    setLoadingPredkontace(true)
    setShowPredkontace(true)
    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setJournalEntries(data.suggested_entries || [])
        toast.success('Předkontace vygenerována')
      } else {
        toast.error('Chyba při generování předkontace')
      }
    } catch {
      toast.error('Chyba při generování předkontace')
    }
    setLoadingPredkontace(false)
  }

  const handleEntryAction = async (entryId: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, status: action }),
      })
      if (res.ok) {
        setJournalEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, status: action } : e
        ))
        toast.success(action === 'approved' ? 'Schváleno' : 'Vráceno k úpravě')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleApproveAll = async () => {
    const suggested = journalEntries.filter(e => e.status === 'suggested')
    for (const entry of suggested) {
      await handleEntryAction(entry.id, 'approved')
    }
  }

  const statusColor = DOCUMENT_STATUS_COLORS[doc.status]

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border dark:border-gray-700 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-gray-400" />
            {editingName ? (
              <div className="flex items-center gap-1">
                <input type="text" value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setEditingName(false); setNewFileName(doc.file_name) } }}
                  className="text-sm font-medium px-1.5 py-0.5 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white min-w-[200px]"
                  autoFocus />
                <button onClick={handleRename} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => { setEditingName(false); setNewFileName(doc.file_name) }} className="p-0.5 text-gray-500 hover:bg-gray-50 rounded"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 group"
                onClick={() => { setNewFileName(doc.file_name); setEditingName(true) }}
                title="Klikněte pro přejmenování">
                {doc.file_name}
                <Pencil className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-50" />
              </span>
            )}
            {doc.storage_path && (
              <>
                <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')} title="Náhled">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={async () => {
                  const res = await fetch(`/api/documents/${doc.id}/download`)
                  if (res.ok) {
                    const data = await res.json()
                    const a = document.createElement('a')
                    a.href = data.url
                    a.download = data.file_name || doc.file_name
                    a.click()
                  }
                }} title="Stáhnout">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Badge className={`${statusColor.bg} ${statusColor.text} text-xs`}>
              {DOCUMENT_STATUS_LABELS[doc.status]}
            </Badge>
            <ConfidenceBadge score={doc.confidence_score} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Select value={doc.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-6 w-auto min-w-[120px] text-xs border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-2 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>| {doc.period} | Nahráno: {formatDate(doc.uploaded_at)}</span>
            {doc.accounting_number && <> | <Hash className="h-3 w-3 inline" /> {doc.accounting_number}</>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {extractable && doc.status !== 'approved' && doc.status !== 'booked' && (
            <Button variant="outline" size="sm" onClick={handleExtract} disabled={extracting}>
              {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              {doc.ocr_processed ? 'Znovu vytěžit' : 'Vytěžit'}
            </Button>
          )}
        </div>
      </div>

      {/* Extraction pipeline progress */}
      {extractionJob && (
        <div className={cn(
          'rounded-lg p-3 space-y-2 border',
          extractionJob.status === 'completed'
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
        )}>
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-xs font-semibold uppercase',
              extractionJob.status === 'completed'
                ? 'text-green-700 dark:text-green-300'
                : 'text-blue-700 dark:text-blue-300'
            )}>
              {extractionJob.status === 'completed' ? 'Vytěžení dokončeno' : 'Pipeline vytěžování'}
            </span>
            {extractionJob.steps.length > 0 && (() => {
              const first = extractionJob.steps[0]
              const last = extractionJob.steps[extractionJob.steps.length - 1]
              const totalMs = (last.completedAt || Date.now()) - first.startedAt
              return <span className={cn(
                'text-xs',
                extractionJob.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
              )}>Celkem: {Math.floor(totalMs / 1000)}s</span>
            })()}
          </div>
          <div className="space-y-1">
            {PIPELINE_STEPS.map((step) => {
              const stepRecord = extractionJob.steps.find(s => s.step === step)
              const isCurrent = extractionJob.currentStep === step
              const isCompleted = stepRecord?.completedAt != null
              const isPending = !stepRecord

              const duration = stepRecord
                ? ((stepRecord.completedAt || Date.now()) - stepRecord.startedAt) / 1000
                : 0

              return (
                <div key={step} className="flex items-center gap-2 text-xs">
                  {isCompleted ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                  <span className={cn(
                    'flex-1',
                    isCompleted ? 'text-gray-600 dark:text-gray-400' :
                    isCurrent ? 'text-blue-700 dark:text-blue-300 font-medium' :
                    'text-gray-400 dark:text-gray-600'
                  )}>
                    {STEP_LABELS[step]}
                  </span>
                  {isPending && STEP_ESTIMATES[step] && (
                    <span className="text-gray-400 dark:text-gray-500 tabular-nums">
                      {STEP_ESTIMATES[step]}
                    </span>
                  )}
                  {(isCompleted || isCurrent) && (
                    <span className={cn(
                      'tabular-nums',
                      isCurrent && duration > 30 ? 'text-amber-600' :
                      isCurrent ? 'text-blue-600 dark:text-blue-400' :
                      'text-gray-400 dark:text-gray-500'
                    )}>
                      {Math.floor(duration)}s{isCurrent && '...'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {extractionJob.status === 'completed' && (
            <div className="text-xs text-green-700 dark:text-green-400 font-medium pt-1 border-t border-green-200 dark:border-green-800">
              <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
              Vytěžení úspěšně dokončeno
            </div>
          )}
        </div>
      )}

      {/* Multi-page PDF warning */}
      {numPages && numPages > 2 && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            Tento PDF má <strong>{numPages} stránek</strong>. Pokud obsahuje více dokumentů, nahrajte je prosím zvlášť pro přesnější vytěžení.
          </div>
        </div>
      )}

      {/* OCR data display */}
      {ocrData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Supplier info — only if has data */}
          {hasSupplierData && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Dodavatel
              </h4>
              <div className="space-y-1 text-sm">
                {!!supplier!.name && <div className="font-medium text-gray-900 dark:text-white">{String(supplier!.name)}</div>}
                {!!supplier!.ico && <div className="text-gray-600 dark:text-gray-400">IČO: {String(supplier!.ico)}</div>}
                {!!supplier!.dic && <div className="text-gray-600 dark:text-gray-400">DIČ: {String(supplier!.dic)}</div>}
                {!!supplier!.address && <div className="text-gray-600 dark:text-gray-400">{String(supplier!.address)}</div>}
                {!!supplier!.bank_account && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Účet: {String(supplier!.bank_account)}{supplier!.bank_code ? `/${String(supplier!.bank_code)}` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document details */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Detail dokladu
            </h4>
            <div className="space-y-1 text-sm">
              {doc.document_number && <div className="text-gray-600 dark:text-gray-400">Číslo: <span className="font-medium text-gray-900 dark:text-white">{doc.document_number}</span></div>}
              {doc.variable_symbol && <div className="text-gray-600 dark:text-gray-400">VS: {doc.variable_symbol}</div>}
              {doc.constant_symbol && <div className="text-gray-600 dark:text-gray-400">KS: {doc.constant_symbol}</div>}
              {doc.date_issued && <div className="text-gray-600 dark:text-gray-400">Vystaveno: {formatDate(doc.date_issued)}</div>}
              {doc.date_due && <div className="text-gray-600 dark:text-gray-400">Splatnost: {formatDate(doc.date_due)}</div>}
              {doc.date_tax && <div className="text-gray-600 dark:text-gray-400">DUZP: {formatDate(doc.date_tax)}</div>}
              {doc.payment_type && <div className="text-gray-600 dark:text-gray-400">Platba: {doc.payment_type}</div>}
            </div>
          </div>

          {/* Amounts — only if has values */}
          {hasAmounts && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Částky
              </h4>
              <div className="space-y-1 text-sm">
                {doc.total_without_vat !== null && <div className="text-gray-600 dark:text-gray-400">Základ: {formatCurrency(doc.total_without_vat)}</div>}
                {doc.total_vat !== null && <div className="text-gray-600 dark:text-gray-400">DPH: {formatCurrency(doc.total_vat)}</div>}
                {doc.total_with_vat !== null && <div className="font-semibold text-gray-900 dark:text-white">Celkem: {formatCurrency(doc.total_with_vat)}</div>}
                {doc.currency && doc.currency !== 'CZK' && <div className="text-gray-600 dark:text-gray-400">Měna: {doc.currency}</div>}
              </div>
            </div>
          )}

          {/* Items */}
          {items && items.length > 0 && (
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Položky</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="text-left py-1 text-xs text-gray-500 dark:text-gray-400">Popis</th>
                      <th className="text-right py-1 text-xs text-gray-500 dark:text-gray-400">Množství</th>
                      <th className="text-right py-1 text-xs text-gray-500 dark:text-gray-400">Cena/ks</th>
                      <th className="text-right py-1 text-xs text-gray-500 dark:text-gray-400">DPH</th>
                      <th className="text-right py-1 text-xs text-gray-500 dark:text-gray-400">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b dark:border-gray-700">
                        <td className="py-1 text-gray-900 dark:text-white">{String(item.description || '')}</td>
                        <td className="py-1 text-right text-gray-600 dark:text-gray-400">{item.quantity ? `${item.quantity} ${item.unit || 'ks'}` : ''}</td>
                        <td className="py-1 text-right text-gray-600 dark:text-gray-400">{item.unit_price ? formatCurrency(Number(item.unit_price)) : ''}</td>
                        <td className="py-1 text-right text-gray-600 dark:text-gray-400">{item.vat_amount ? formatCurrency(Number(item.vat_amount)) : ''}</td>
                        <td className="py-1 text-right font-medium text-gray-900 dark:text-white">{item.total_price ? formatCurrency(Number(item.total_price)) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw JSON viewer */}
          <div className="md:col-span-2 border-t dark:border-gray-700 pt-3 mt-2">
            <details>
              <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 select-none">
                <Code className="h-3 w-3" /> Vytěžená data (JSON)
              </summary>
              <div className="relative mt-2">
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(ocrData, null, 2)); toast.success('Zkopírováno') }}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-white/80 dark:bg-gray-800/80 rounded" title="Kopírovat">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(ocrData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}

      {!ocrData && !doc.ocr_processed && !extractable && (
        <div className="text-center py-3 text-sm text-gray-400 dark:text-gray-500">
          Tento typ dokladu nepodléhá vytěžování
        </div>
      )}

      {/* Predkontace */}
      {doc.ocr_processed && (
        <div className="border-t dark:border-gray-700 pt-3">
          <details open={showPredkontace || journalEntries.length > 0}>
            <summary className="flex items-center justify-between cursor-pointer select-none group">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                <BookOpen className="h-3 w-3" /> Předkontace
                {journalEntries.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1">{journalEntries.length}</Badge>
                )}
              </h4>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {journalEntries.length > 0 && journalEntries.some(e => e.status === 'suggested') && (
                  <Button size="sm" variant="outline" className="text-green-600 border-green-300 h-7 text-xs" onClick={handleApproveAll}>
                    <Check className="h-3 w-3 mr-1" /> Schválit vše
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleGeneratePredkontace}
                  disabled={loadingPredkontace}
                >
                  {loadingPredkontace ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
                  {journalEntries.length > 0 ? 'Přegenerovat' : 'Navrhnout předkontaci'}
                </Button>
              </div>
            </summary>

          <div className="mt-3 space-y-3">
          {journalEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">#</th>
                    <th className="text-left py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">Popis</th>
                    <th className="text-left py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">MD</th>
                    <th className="text-left py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">D</th>
                    <th className="text-right py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">Částka</th>
                    <th className="text-center py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">Jistota</th>
                    <th className="text-center py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-center py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map(entry => {
                    const confidencePct = entry.confidence ? Math.round(entry.confidence * 100) : null
                    const confidenceColor = confidencePct && confidencePct >= 80 ? 'text-green-600' :
                      confidencePct && confidencePct >= 50 ? 'text-yellow-600' : 'text-red-600'

                    const statusBadge = {
                      suggested: { label: 'Navrženo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                      approved: { label: 'Schváleno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
                      modified: { label: 'Upraveno', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
                      rejected: { label: 'Vráceno k úpravě', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                    }[entry.status] || { label: entry.status, color: 'bg-gray-100 text-gray-700' }

                    const isEditing = editingEntryId === entry.id
                    const isInlineDebit = inlineEditAccount?.entryId === entry.id && inlineEditAccount.field === 'debit'
                    const isInlineCredit = inlineEditAccount?.entryId === entry.id && inlineEditAccount.field === 'credit'

                    return (
                      <tr key={entry.id || entry.line_number} className="border-b dark:border-gray-700">
                        <td className="py-1.5 px-2 text-gray-400">{entry.line_number}</td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white max-w-[200px] truncate">{entry.description}</td>
                        <td className="py-1.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.debit_account}
                              onChange={(e) => setEditValues(v => ({ ...v, debit_account: e.target.value }))}
                              className="w-16 font-mono text-xs px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          ) : isInlineDebit ? (
                            <input
                              type="text"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleInlineAccountSave(entry.id, 'debit'); if (e.key === 'Escape') setInlineEditAccount(null) }}
                              onBlur={() => handleInlineAccountSave(entry.id, 'debit')}
                              className="w-16 font-mono text-xs px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="font-mono text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-purple-300"
                              title={entry.debit_name || 'Klikněte pro editaci'}
                              onClick={() => { setInlineEditAccount({ entryId: entry.id, field: 'debit' }); setInlineEditValue(entry.debit_account) }}
                            >
                              {entry.debit_account}
                            </span>
                          )}
                          {!isEditing && !isInlineDebit && entry.debit_name && <span className="text-xs text-gray-400 ml-1 hidden lg:inline">{entry.debit_name}</span>}
                        </td>
                        <td className="py-1.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.credit_account}
                              onChange={(e) => setEditValues(v => ({ ...v, credit_account: e.target.value }))}
                              className="w-16 font-mono text-xs px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          ) : isInlineCredit ? (
                            <input
                              type="text"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleInlineAccountSave(entry.id, 'credit'); if (e.key === 'Escape') setInlineEditAccount(null) }}
                              onBlur={() => handleInlineAccountSave(entry.id, 'credit')}
                              className="w-16 font-mono text-xs px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-blue-300"
                              title={entry.credit_name || 'Klikněte pro editaci'}
                              onClick={() => { setInlineEditAccount({ entryId: entry.id, field: 'credit' }); setInlineEditValue(entry.credit_account) }}
                            >
                              {entry.credit_account}
                            </span>
                          )}
                          {!isEditing && !isInlineCredit && entry.credit_name && <span className="text-xs text-gray-400 ml-1 hidden lg:inline">{entry.credit_name}</span>}
                        </td>
                        <td className="py-1.5 px-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.amount}
                              onChange={(e) => setEditValues(v => ({ ...v, amount: Number(e.target.value) }))}
                              className="w-24 text-xs text-right px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          ) : (
                            <>{entry.amount.toLocaleString('cs-CZ')} Kč</>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {confidencePct !== null && (
                            <span className={`text-xs font-medium ${confidenceColor}`}>{confidencePct}%</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEntry(entry.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Uložit"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingEntryId(null)}
                                className="p-1 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                                title="Zrušit"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {entry.id && (
                                <button
                                  onClick={() => {
                                    setEditingEntryId(entry.id)
                                    setEditValues({
                                      debit_account: entry.debit_account,
                                      credit_account: entry.credit_account,
                                      amount: entry.amount,
                                      vat_amount: entry.vat_amount,
                                    })
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  title="Upravit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {entry.status === 'suggested' && entry.id && (
                                <button
                                  onClick={() => handleEntryAction(entry.id, 'approved')}
                                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                  title="Schválit"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loadingPredkontace && journalEntries.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              Žádné záznamy předkontace
            </p>
          )}
          </div>
          </details>
        </div>
      )}

      {/* Comments */}
      <DocumentComments
        documentId={doc.id}
        userRole="accountant"
        companyId={companyId}
        userId={userId}
      />
    </div>
  )
}
