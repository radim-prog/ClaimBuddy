'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Download,
  ScanLine,
  Zap,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  DocumentRegisterEntry,
  DocumentFilters,
  SortConfig,
  PaginationState,
  SearchSummary,
  MonthSummary,
  YearSummary,
} from '@/lib/types/document-register'
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  defaultDocumentFilters,
} from '@/lib/types/document-register'
import { DocumentRegisterFilters } from './document-register-filters'
import { DocumentDetailPanel } from './document-detail-panel'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import type { ExtractionStep } from '@/lib/extraction-queue'
import { STEP_LABELS } from '@/lib/extraction-queue'

type QueueJobInfo = {
  documentId: string
  currentStep: ExtractionStep
  stepStartedAt?: number
  steps: Array<{ step: ExtractionStep; startedAt: number; completedAt?: number }>
  status: string
}

interface DocumentRegisterTabProps {
  companyId: string
}

const MONTH_NAMES_SHORT = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const MONTH_NAMES_LONG = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

function getMonthStatus(month: MonthSummary | undefined, year: number, monthIndex: number): 'complete' | 'pending' | 'issues' | 'empty' | 'future' {
  const now = new Date()
  const isCurrentOrPast = year < now.getFullYear() || (year === now.getFullYear() && monthIndex <= now.getMonth())

  if (!month || month.count === 0) {
    return isCurrentOrPast ? 'empty' : 'future'
  }

  const { by_status } = month
  const hasRejected = (by_status['rejected'] || 0) > 0
  const hasMissing = (by_status['missing'] || 0) > 0
  if (hasRejected || hasMissing) return 'issues'

  const totalProcessed = (by_status['approved'] || 0) + (by_status['booked'] || 0)
  if (totalProcessed === month.count) return 'complete'

  return 'pending'
}

const statusColors: Record<string, string> = {
  complete: 'bg-green-500',
  pending: 'bg-yellow-500',
  issues: 'bg-red-500',
  empty: 'bg-gray-300 dark:bg-gray-600',
  future: 'bg-gray-200 dark:bg-gray-700',
}

const statusRingColors: Record<string, string> = {
  complete: 'ring-green-300',
  pending: 'ring-yellow-300',
  issues: 'ring-red-300',
  empty: '',
  future: '',
}

export function DocumentRegisterTab({ companyId }: DocumentRegisterTabProps) {
  const { userId } = useAccountantUser()

  // Year/Month navigation
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [yearSummary, setYearSummary] = useState<YearSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Document list state
  const [documents, setDocuments] = useState<DocumentRegisterEntry[]>([])
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, perPage: 50, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState<SearchSummary>({ total_amount: 0, total_vat: 0, by_type: {}, by_status: {} })
  const [filters, setFilters] = useState<DocumentFilters>(defaultDocumentFilters)
  const [sort, setSort] = useState<SortConfig>({ field: 'date_issued', dir: 'desc' })
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Extraction progress tracking
  const [extractionJobs, setExtractionJobs] = useState<Map<string, QueueJobInfo>>(new Map())
  const [now, setNow] = useState(Date.now())

  // Auto-select current month on first load
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(currentMonth)
  }, [])

  // Fetch year summary
  const fetchYearSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents/summary?year=${selectedYear}`)
      if (res.ok) {
        const data = await res.json()
        setYearSummary(data)
      }
    } catch { /* ignore */ } finally {
      setSummaryLoading(false)
    }
  }, [companyId, selectedYear])

  useEffect(() => { fetchYearSummary() }, [fetchYearSummary])

  // Fetch documents for selected month
  const fetchDocuments = useCallback(async () => {
    if (!selectedMonth) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('q', filters.search)
      filters.types.forEach(t => params.append('type', t))
      filters.statuses.forEach(s => params.append('status', s))
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      if (filters.amountMin !== null) params.set('amount_min', String(filters.amountMin))
      if (filters.amountMax !== null) params.set('amount_max', String(filters.amountMax))
      // Period from month-pills navigation
      params.set('period', selectedMonth)
      params.set('page', String(pagination.page))
      params.set('per_page', String(pagination.perPage))
      params.set('sort_by', sort.field)
      params.set('sort_dir', sort.dir)

      const res = await fetch(`/api/accountant/companies/${companyId}/documents/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
        setPagination(data.pagination)
        setSummary(data.summary)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [companyId, selectedMonth, filters, pagination.page, pagination.perPage, sort])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  // Poll extraction queue when there are extracting documents
  useEffect(() => {
    const extractingDocs = documents.filter(d => d.status === 'extracting' || d.ocr_status === 'processing')
    if (extractingDocs.length === 0) {
      if (extractionJobs.size > 0) setExtractionJobs(new Map())
      return
    }

    const poll = async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/extraction/queue', {
          headers: { 'x-user-id': userId },
        })
        if (res.ok) {
          const data = await res.json()
          const jobMap = new Map<string, QueueJobInfo>()
          for (const job of data.jobs) {
            jobMap.set(job.documentId, job)
          }
          setExtractionJobs(jobMap)
          setNow(Date.now())

          // If no more active jobs, refresh document list
          const hasActive = data.jobs.some((j: { status: string }) => j.status === 'queued' || j.status === 'processing')
          if (!hasActive && extractingDocs.length > 0) {
            fetchDocuments()
            fetchYearSummary()
          }
        }
      } catch { /* ignore */ }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [documents, userId, fetchDocuments, fetchYearSummary])

  // Handlers
  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters)
    setPagination(p => ({ ...p, page: 1 }))
    setSelectedIds(new Set())
  }

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleMonthClick = (month: string) => {
    setSelectedMonth(month)
    setPagination(p => ({ ...p, page: 1 }))
    setSelectedIds(new Set())
    setExpandedId(null)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)))
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        setSelectedIds(new Set())
        fetchDocuments()
        fetchYearSummary()
      }
    } catch { /* ignore */ } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkExtract = async () => {
    if (selectedIds.size === 0 || !userId) return
    setBulkLoading(true)
    try {
      const uploadedIds = documents
        .filter(d => selectedIds.has(d.id) && d.status === 'uploaded')
        .map(d => d.id)
      if (uploadedIds.length > 0) {
        await fetch('/api/extraction/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ documentIds: uploadedIds }),
        })
      }
      setSelectedIds(new Set())
      fetchDocuments()
    } catch { /* ignore */ } finally {
      setBulkLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    await fetch(`/api/accountant/companies/${companyId}/documents/bulk`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: [id], action: 'approve' }),
    })
    fetchDocuments()
    fetchYearSummary()
  }

  const handleReject = async (id: string, reason?: string) => {
    await fetch(`/api/accountant/companies/${companyId}/documents/bulk`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: [id], action: 'reject', rejection_reason: reason }),
    })
    fetchDocuments()
    fetchYearSummary()
  }

  const handleExtract = async (id: string) => {
    await fetch(`/api/accountant/companies/${companyId}/documents/${id}/extract`, {
      method: 'POST',
    })
    fetchDocuments()
  }

  // Computed
  const availableYears = yearSummary?.available_years ?? [new Date().getFullYear()]
  const selectedMonthData = selectedMonth && yearSummary?.months?.[selectedMonth]
  const selectedMonthIndex = selectedMonth ? parseInt(selectedMonth.split('-')[1]) - 1 : -1

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sort.field === field ? (
          sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  )

  return (
    <div className="space-y-3">
      {/* Combined Navigator: Year selector + Month strip + Summary — all in one block */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 overflow-hidden">
        {/* Year + Month row */}
        <div className="flex items-center gap-0 border-b border-gray-100 dark:border-gray-800">
          {/* Year selector */}
          <div className="flex items-center border-r border-gray-100 dark:border-gray-800">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year)
                  const now = new Date()
                  if (year === now.getFullYear()) {
                    setSelectedMonth(`${year}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                  } else {
                    setSelectedMonth(`${year}-01`)
                  }
                  setPagination(p => ({ ...p, page: 1 }))
                }}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  selectedYear === year
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Month pills — horizontal scroll */}
          <div className="flex items-center gap-0.5 px-2 flex-1 overflow-x-auto">
            {MONTH_NAMES_SHORT.map((name, i) => {
              const period = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
              const monthData = yearSummary?.months?.[period]
              const status = getMonthStatus(monthData as MonthSummary | undefined, selectedYear, i)
              const isSelected = selectedMonth === period
              const count = monthData?.count ?? 0

              return (
                <button
                  key={period}
                  onClick={() => handleMonthClick(period)}
                  disabled={status === 'future'}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? 'text-gray-900 dark:text-white'
                      : status === 'future'
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
                  {name}
                  {count > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500">{count}</span>}
                  {isSelected && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-purple-500" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Summary strip */}
        {selectedMonth && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedMonthIndex >= 0 ? MONTH_NAMES_LONG[selectedMonthIndex] : ''} {selectedYear}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {pagination.total} doklad{pagination.total === 1 ? '' : pagination.total < 5 ? 'y' : 'ů'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Celkem <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.total_amount)}</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                DPH <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.total_vat)}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <DocumentRegisterFilters filters={filters} onChange={handleFilterChange} />

      {/* Bulk actions */}
      {selectedIds.size > 0 && (() => {
        const selectedDocs = documents.filter(d => selectedIds.has(d.id))
        const hasUploaded = selectedDocs.some(d => d.status === 'uploaded')
        const hasExtracted = selectedDocs.some(d => d.status === 'extracted')
        return (
          <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 px-4 py-2.5 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Vybráno: {selectedIds.size}
            </span>
            {hasUploaded && (
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-300" onClick={handleBulkExtract} disabled={bulkLoading}>
                {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ScanLine className="h-4 w-4 mr-1" />}
                Vytěžit
              </Button>
            )}
            {hasExtracted && (
              <>
                <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => handleBulkAction('approve')} disabled={bulkLoading}>
                  {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Schválit
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleBulkAction('reject')} disabled={bulkLoading}>
                  <XCircle className="h-4 w-4 mr-1" /> Zamítnout
                </Button>
              </>
            )}
          </div>
        )
      })()}

      {/* Document Table */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedMonth
                ? `Žádné doklady za ${selectedMonthIndex >= 0 ? MONTH_NAMES_LONG[selectedMonthIndex].toLowerCase() : ''} ${selectedYear}`
                : 'Vyberte měsíc'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2.5 px-3 w-8">
                      <Checkbox
                        checked={selectedIds.size === documents.length && documents.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <SortHeader field="supplier_name" label="Dodavatel" />
                    <SortHeader field="type" label="Typ" />
                    <SortHeader field="total_with_vat" label="Částka" />
                    <SortHeader field="date_issued" label="Datum" />
                    <SortHeader field="status" label="Stav" />
                    <th className="py-2.5 px-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {documents.map(doc => {
                    const isSelected = selectedIds.has(doc.id)
                    const isExpanded = expandedId === doc.id
                    const statusColor = DOCUMENT_STATUS_COLORS[doc.status]

                    return (
                      <><tr
                          key={doc.id}
                          onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                        >
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(doc.id)} />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                              {doc.supplier_name || doc.file_name}
                            </div>
                            {doc.variable_symbol && (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">VS: {doc.variable_symbol}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {DOCUMENT_TYPE_LABELS[doc.type]?.substring(0, 14) || doc.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {doc.total_with_vat !== null ? formatCurrency(doc.total_with_vat) : '—'}
                            </div>
                            {doc.total_vat !== null && doc.total_vat > 0 && (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">DPH {formatCurrency(doc.total_vat)}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {doc.date_issued ? formatDate(doc.date_issued) : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            {(doc.status === 'extracting' || doc.ocr_status === 'processing') && extractionJobs.has(doc.id) ? (() => {
                              const job = extractionJobs.get(doc.id)!
                              const elapsed = job.stepStartedAt ? Math.floor((now - job.stepStartedAt) / 1000) : 0
                              const elapsedColor = elapsed > 60 ? 'text-red-600' : elapsed > 30 ? 'text-amber-600' : 'text-blue-600'
                              return (
                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${elapsedColor}`}>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>{STEP_LABELS[job.currentStep] || job.currentStep}</span>
                                  <span className="tabular-nums">{elapsed}s</span>
                                </span>
                              )
                            })() : (
                              <Badge className={`${statusColor.bg} ${statusColor.text} text-[11px] border-0`}>
                                {DOCUMENT_STATUS_LABELS[doc.status]}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {doc.storage_path && (
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
                                className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                title="Stáhnout"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${doc.id}-detail`}>
                            <td colSpan={7} className="p-2">
                              <DocumentDetailPanel
                                document={doc}
                                companyId={companyId}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onExtract={handleExtract}
                                extractionJob={extractionJobs.get(doc.id)}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} z {pagination.total}
              </span>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-center">
                  {pagination.page}/{pagination.totalPages || 1}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Yearly Total — compact */}
      {yearSummary && yearSummary.yearly_total.count > 0 && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
            Rok {selectedYear}: {yearSummary.yearly_total.count} dokladů
          </span>
          <span>
            Celkem <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(yearSummary.yearly_total.amount)}</span>
            {' · '}DPH <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(yearSummary.yearly_total.vat)}</span>
          </span>
        </div>
      )}
    </div>
  )
}
