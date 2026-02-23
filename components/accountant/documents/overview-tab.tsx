'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Filter,
  Banknote,
  Receipt,
  FileInput,
  FileOutput,
} from 'lucide-react'

type DocumentRecord = {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  ocr_processed: boolean
  ocr_status: string | null
  ocr_data: Record<string, unknown> | null
  uploaded_by: string | null
  uploaded_at: string
  upload_source: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
}

type MonthSummary = {
  period: string
  closure_status: string | null
  bank_statement: { status: string; count: number }
  expense_documents: { status: string; count: number }
  income_invoices: { status: string; count: number }
  receipts: { count: number }
  total_documents: number
  approved_documents: number
}

type AnnualData = {
  year: number
  months: MonthSummary[]
  totals: { total_documents: number; approved: number; missing_months: number }
}

interface OverviewTabProps {
  companyId: string
}

const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const monthNamesFull = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

const typeLabels: Record<string, string> = {
  bank_statement: 'Výpis z banky',
  expense_invoice: 'Nákladová faktura',
  income_invoice: 'Příjmová faktura',
  receipt: 'Účtenka',
  contract: 'Smlouva',
  other: 'Ostatní',
}

const typeIcons: Record<string, typeof FileText> = {
  bank_statement: Banknote,
  expense_invoice: FileInput,
  income_invoice: FileOutput,
  receipt: Receipt,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getOcrSummary(doc: DocumentRecord): string | null {
  if (!doc.ocr_data) return null
  const d = doc.ocr_data as Record<string, unknown>
  const parts: string[] = []
  const supplier = d.supplier as Record<string, unknown> | undefined
  if (supplier?.name) parts.push(String(supplier.name))
  if (d.total_with_vat) parts.push(`${Number(d.total_with_vat).toLocaleString('cs-CZ')} Kč`)
  if (d.variable_symbol) parts.push(`VS: ${d.variable_symbol}`)
  if (d.document_number) parts.push(`č. ${d.document_number}`)
  return parts.length > 0 ? parts.join(' • ') : null
}

export function OverviewTab({ companyId }: OverviewTabProps) {
  const router = useRouter()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [annualData, setAnnualData] = useState<AnnualData | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [docsLoading, setDocsLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const selectedPeriod = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const fetchAnnualSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents/annual-summary?year=${selectedYear}`)
      if (res.ok) setAnnualData(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [companyId, selectedYear])

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents?period=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents ?? [])
      }
    } catch { /* ignore */ } finally {
      setDocsLoading(false)
    }
  }, [companyId, selectedPeriod])

  useEffect(() => { fetchAnnualSummary() }, [fetchAnnualSummary])
  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const monthData = useMemo(() => {
    if (!annualData) return null
    return annualData.months[selectedMonth] || null
  }, [annualData, selectedMonth])

  const filteredDocs = useMemo(() => {
    if (filterType === 'all') return documents
    return documents.filter(d => d.type === filterType)
  }, [documents, filterType])

  const handleApproveReject = async (documentId: string, action: 'approve' | 'reject') => {
    setActionLoading(documentId)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, action }),
      })
      if (res.ok) {
        fetchDocuments()
        fetchAnnualSummary()
      }
    } catch { /* ignore */ } finally {
      setActionLoading(null)
    }
  }

  const getMonthStatus = (month: MonthSummary | undefined, index: number): 'complete' | 'uploaded' | 'missing' | 'future' | 'unknown' => {
    if (selectedYear > currentYear || (selectedYear === currentYear && index > currentMonth)) return 'future'
    if (!month) return 'unknown'
    const { bank_statement, expense_documents, income_invoices } = month
    if (bank_statement.status === 'approved' && expense_documents.status === 'approved' && income_invoices.status === 'approved') return 'complete'
    if (bank_statement.status === 'uploaded' || expense_documents.status === 'uploaded' || income_invoices.status === 'uploaded') return 'uploaded'
    return 'missing'
  }

  const statusColors: Record<string, string> = {
    complete: 'bg-green-500 text-white',
    uploaded: 'bg-yellow-400 text-yellow-900',
    missing: 'bg-red-500 text-white',
    future: 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
    unknown: 'bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400',
  }

  const statusIcons: Record<string, string> = {
    complete: '\u2713',
    uploaded: '\u23F3',
    missing: '!',
    future: '\u2014',
    unknown: '?',
  }

  if (loading && !annualData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Year selector + month grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedYear(y => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= currentYear}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {annualData && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {annualData.totals.total_documents} dokladů celkem
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {monthNames.map((month, index) => {
            const mData = annualData?.months[index]
            const status = getMonthStatus(mData, index)
            const isSelected = selectedMonth === index
            const isCurrent = selectedYear === currentYear && index === currentMonth
            const isFuture = selectedYear > currentYear || (selectedYear === currentYear && index > currentMonth)

            return (
              <button
                key={month}
                onClick={() => { if (!isFuture) setSelectedMonth(index) }}
                disabled={isFuture}
                className={`flex flex-col items-center py-1 transition-all ${isFuture ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className={`
                  w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold
                  ${statusColors[status]}
                  ${isSelected ? 'ring-2 ring-purple-600 ring-offset-1 dark:ring-offset-gray-900' : ''}
                  ${isCurrent && !isSelected ? 'ring-1 ring-purple-400' : ''}
                  ${!isFuture ? 'hover:opacity-80' : ''}
                `}>
                  {statusIcons[status]}
                </div>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {month}
                </span>
                {mData && mData.total_documents > 0 && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">
                    {mData.total_documents}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected month detail */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNamesFull[selectedMonth]} {selectedYear}
          </h3>
          <div className="flex items-center gap-2">
            {selectedYear === currentYear && selectedMonth === currentMonth && (
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Aktuální měsíc
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push(`/accountant/extraction?company=${companyId}&period=${selectedPeriod}`)}>
              <Upload className="h-4 w-4 mr-1" />
              Nahrát
            </Button>
          </div>
        </div>

        {/* 3 status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { key: 'bank_statement', label: 'Výpis z banky', icon: Banknote },
            { key: 'expense_documents', label: 'Nákladové doklady', icon: FileInput },
            { key: 'income_invoices', label: 'Příjmové faktury', icon: FileOutput },
          ].map(({ key, label, icon: Icon }) => {
            const data = monthData ? (monthData as Record<string, unknown>)[key] as { status: string; count: number } | null : null
            const status = data?.status || 'missing'
            const count = data?.count || 0

            const colors: Record<string, string> = {
              approved: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
              uploaded: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
              missing: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              rejected: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            }

            const statusLabels: Record<string, string> = {
              approved: 'Schváleno',
              uploaded: 'Ke schválení',
              missing: 'Chybí',
              rejected: 'Zamítnuto',
            }

            return (
              <div key={key} className={`p-4 rounded-lg border-2 ${colors[status] || colors.missing}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{label}</span>
                  </div>
                  {status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : status === 'uploaded' ? (
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    status === 'approved' ? 'text-green-700 dark:text-green-400' :
                    status === 'uploaded' ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {statusLabels[status] || status}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{count} ks</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Document list */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Dokumenty ({documents.length})</h4>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny typy</SelectItem>
                  <SelectItem value="bank_statement">Výpisy</SelectItem>
                  <SelectItem value="expense_invoice">Nákladové</SelectItem>
                  <SelectItem value="income_invoice">Příjmové</SelectItem>
                  <SelectItem value="receipt">Účtenky</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">Žádné dokumenty pro {monthNamesFull[selectedMonth].toLowerCase()} {selectedYear}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push(`/accountant/extraction?company=${companyId}&period=${selectedPeriod}`)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Nahrát první dokument
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map(doc => {
                  const TypeIcon = typeIcons[doc.type] || FileText
                  const ocrSummary = getOcrSummary(doc)
                  const isProcessing = actionLoading === doc.id

                  return (
                    <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        doc.type === 'bank_statement' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        doc.type === 'income_invoice' ? 'bg-green-100 dark:bg-green-900/30' :
                        doc.type === 'expense_invoice' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <TypeIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{doc.file_name}</span>
                          <Badge variant="outline" className="text-xs">{typeLabels[doc.type] || doc.type}</Badge>
                          {doc.status === 'approved' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Schváleno</Badge>}
                          {doc.status === 'uploaded' && <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Ke schválení</Badge>}
                          {doc.status === 'rejected' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Zamítnuto</Badge>}
                        </div>
                        {ocrSummary && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{ocrSummary}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(doc.uploaded_at)}</span>
                          <span>{formatFileSize(doc.file_size_bytes)}</span>
                          {doc.upload_source !== 'web' && <Badge variant="outline" className="text-[10px] px-1 py-0">{doc.upload_source}</Badge>}
                          {doc.ocr_processed && doc.ocr_status === 'completed' && (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-0.5"><Eye className="h-3 w-3" /> OCR</span>
                          )}
                        </div>
                        {doc.rejection_reason && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Důvod zamítnutí: {doc.rejection_reason}</p>}
                      </div>

                      {doc.status === 'uploaded' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" disabled={isProcessing} onClick={() => handleApproveReject(doc.id, 'approve')}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" disabled={isProcessing} onClick={() => handleApproveReject(doc.id, 'reject')}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing documents warning */}
        {monthData && (
          <div className="mt-3">
            {monthData.bank_statement.status === 'missing' && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" /><span>Chybí výpis z banky</span>
              </div>
            )}
            {monthData.expense_documents.status === 'missing' && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" /><span>Chybí nákladové doklady</span>
              </div>
            )}
            {monthData.income_invoices.status === 'missing' && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" /><span>Chybí příjmové faktury</span>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Hotovo</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Ke schválení</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Chybí</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600"></span> Budoucí</span>
        </div>
      </div>
    </div>
  )
}
