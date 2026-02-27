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
    <div className="space-y-4">
      {/* Year Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year)
              // Auto-select January of the new year (or current month if current year)
              const now = new Date()
              if (year === now.getFullYear()) {
                setSelectedMonth(`${year}-${String(now.getMonth() + 1).padStart(2, '0')}`)
              } else {
                setSelectedMonth(`${year}-01`)
              }
              setPagination(p => ({ ...p, page: 1 }))
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedYear === year
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Month Pills */}
      <div className="grid grid-cols-12 gap-1.5">
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
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all ${
                isSelected
                  ? `bg-white dark:bg-gray-700 shadow-md ring-2 ${statusRingColors[status] || 'ring-purple-300'}`
                  : status === 'future'
                    ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-300 dark:text-gray-600 cursor-default'
                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
              }`}
              disabled={status === 'future'}
            >
              <span className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {name}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                <span className={`text-[10px] ${isSelected ? 'text-gray-700 dark:text-gray-300 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {count > 0 ? count : '—'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Month Summary Card */}
      {selectedMonth && (
        <Card className="rounded-xl shadow-sm border-gray-200/80 dark:border-gray-700/80">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-500" />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedMonthIndex >= 0 ? MONTH_NAMES_LONG[selectedMonthIndex] : ''} {selectedYear}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 mx-2">|</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {summary.by_type ? Object.values(summary.by_type).reduce((a, b) => a + b, 0) : pagination.total} doklad{pagination.total === 1 ? '' : pagination.total < 5 ? 'y' : 'u'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Celkem: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.total_amount)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">DPH: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.total_vat)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <DocumentRegisterFilters filters={filters} onChange={handleFilterChange} />

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 px-4 py-2.5 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Vybrano: {selectedIds.size}
          </span>
          <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => handleBulkAction('approve')} disabled={bulkLoading}>
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Schvalit
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleBulkAction('reject')} disabled={bulkLoading}>
            <XCircle className="h-4 w-4 mr-1" /> Zamitnout
          </Button>
        </div>
      )}

      {/* Document Table */}
      <Card className="rounded-xl shadow-sm border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
        <CardContent className="pt-0 px-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Nacitam doklady...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                <Inbox className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {selectedMonth
                  ? `Zadne doklady za ${selectedMonthIndex >= 0 ? MONTH_NAMES_LONG[selectedMonthIndex].toLowerCase() : ''} ${selectedYear}`
                  : 'Vyberte mesic'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Zkuste upravit filtry nebo nahrat novy doklad</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="py-3 px-4 w-8">
                        <Checkbox
                          checked={selectedIds.size === documents.length && documents.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <SortHeader field="accounting_number" label="Cislo" />
                      <SortHeader field="type" label="Typ" />
                      <SortHeader field="supplier_name" label="Dodavatel" />
                      <SortHeader field="total_with_vat" label="Castka" />
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">DPH</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">VS</th>
                      <SortHeader field="date_issued" label="Datum" />
                      <SortHeader field="status" label="Status" />
                      <th className="text-center py-3 px-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">OCR</th>
                      <th className="text-center py-3 px-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => {
                      const isSelected = selectedIds.has(doc.id)
                      const isExpanded = expandedId === doc.id
                      const statusColor = DOCUMENT_STATUS_COLORS[doc.status]

                      return (
                        <><tr
                            key={doc.id}
                            className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}
                          >
                            <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(doc.id)} />
                            </td>
                            <td className="py-2.5 px-4 text-sm font-mono text-gray-700 dark:text-gray-300" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.accounting_number || '—'}
                            </td>
                            <td className="py-2.5 px-4" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {DOCUMENT_TYPE_LABELS[doc.type]?.substring(0, 12) || doc.type}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-sm text-gray-900 dark:text-white max-w-[180px] truncate" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.supplier_name || doc.file_name}
                            </td>
                            <td className="py-2.5 px-4 text-sm font-medium text-gray-900 dark:text-white text-right whitespace-nowrap" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.total_with_vat !== null ? formatCurrency(doc.total_with_vat) : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.total_vat !== null ? formatCurrency(doc.total_vat) : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.variable_symbol || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.date_issued ? formatDate(doc.date_issued) : '—'}
                            </td>
                            <td className="py-2.5 px-4" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              <Badge className={`${statusColor.bg} ${statusColor.text} text-xs`}>
                                {DOCUMENT_STATUS_LABELS[doc.status]}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-center" onClick={() => setExpandedId(isExpanded ? null : doc.id)}>
                              {doc.confidence_score !== null ? (
                                <span className={`text-xs font-medium ${doc.confidence_score >= 85 ? 'text-green-600' : doc.confidence_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {doc.confidence_score}%
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                                  className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                  title="Stáhnout"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${doc.id}-detail`}>
                              <td colSpan={11} className="p-2">
                                <DocumentDetailPanel
                                  document={doc}
                                  companyId={companyId}
                                  onApprove={handleApprove}
                                  onReject={handleReject}
                                  onExtract={handleExtract}
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

              {/* Pagination + Page Summary */}
              <div className="mt-0 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span>Zobrazeno {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} z {pagination.total}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {pagination.page} / {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Yearly Total */}
      {yearSummary && yearSummary.yearly_total.count > 0 && (
        <Card className="rounded-xl shadow-sm border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rok {selectedYear}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  — {yearSummary.yearly_total.count} doklad{yearSummary.yearly_total.count === 1 ? '' : yearSummary.yearly_total.count < 5 ? 'y' : 'u'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Celkem: </span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">{formatCurrency(yearSummary.yearly_total.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">DPH: </span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">{formatCurrency(yearSummary.yearly_total.vat)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
