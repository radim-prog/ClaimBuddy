'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MinusCircle,
  Banknote,
  FileInput,
  FileOutput,
} from 'lucide-react'
import { toast } from 'sonner'
import { UploadDialog } from './documents/upload-dialog'

type MonthSummary = {
  period: string
  closure_id: string | null
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

type TaxFiling = {
  id: string
  period: string
  type: string
  status: string
}

interface WorkOverviewSectionProps {
  companyId: string
  vatPayer?: boolean
  vatPeriod?: 'monthly' | 'quarterly' | null
  accountingStartDate?: string | null
}

const MONTHS = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const MONTHS_FULL = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

const TAX_LABELS: Record<string, string> = { dph: 'DPH', kontrolni_hlaseni: 'KH', souhrnne_hlaseni: 'SH' }
const TAX_STATUS_CYCLE = ['not_filed', 'in_preparation', 'filed', 'paid'] as const
const QUARTER_MONTHS = [2, 5, 8, 11] // 0-indexed: Mar, Jun, Sep, Dec

const DOC_CATEGORIES = [
  { key: 'bank_statement', field: 'bank_statement_status', label: 'Výpisy', icon: Banknote },
  { key: 'expense_documents', field: 'expense_documents_status', label: 'Náklady', icon: FileInput },
  { key: 'income_invoices', field: 'income_invoices_status', label: 'Příjmy', icon: FileOutput },
] as const

export function WorkOverviewSection({ companyId, vatPayer = true, vatPeriod = 'monthly', accountingStartDate }: WorkOverviewSectionProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [annualData, setAnnualData] = useState<AnnualData | null>(null)
  const [taxFilings, setTaxFilings] = useState<TaxFiling[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const selectedPeriod = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const startDate = useMemo(() => {
    if (!accountingStartDate) return null
    return new Date(accountingStartDate)
  }, [accountingStartDate])

  const isBeforeStart = useCallback((year: number, mi: number): boolean => {
    if (!startDate) return false
    return new Date(year, mi, 1) < new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  }, [startDate])

  const fetchAnnual = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/documents/annual-summary?year=${selectedYear}`)
      if (res.ok) setAnnualData(await res.json())
    } catch { /* */ } finally { setLoading(false) }
  }, [companyId, selectedYear])

  const fetchTax = useCallback(async () => {
    if (!vatPayer) return
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/tax-filings?year=${selectedYear}`)
      if (res.ok) { const d = await res.json(); setTaxFilings(d.filings ?? []) }
    } catch { /* */ }
  }, [companyId, selectedYear, vatPayer])

  useEffect(() => { fetchAnnual() }, [fetchAnnual])
  useEffect(() => { fetchTax() }, [fetchTax])

  const monthData = annualData?.months[selectedMonth] || null

  // Month status for calendar pills
  const getStatus = (m: MonthSummary | undefined, i: number): string => {
    if (selectedYear > currentYear || (selectedYear === currentYear && i > currentMonth)) return 'future'
    if (isBeforeStart(selectedYear, i)) return 'irrelevant'
    const isCurrent = selectedYear === currentYear && i === currentMonth
    if (!m) return isCurrent ? 'current' : 'missing'
    const statuses = [m.bank_statement.status, m.expense_documents.status, m.income_invoices.status]
    if (statuses.every(s => s === 'approved' || s === 'skipped')) return 'complete'
    if (statuses.some(s => s === 'uploaded')) return 'uploaded'
    if (statuses.every(s => s === 'skipped' || s === 'missing')) {
      if (statuses.some(s => s === 'skipped')) return 'partial'
    }
    return isCurrent ? 'current' : 'missing'
  }

  const pillColor: Record<string, string> = {
    complete: 'bg-green-500 text-white',
    uploaded: 'bg-yellow-400 text-yellow-900',
    current: 'bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-orange-100',
    missing: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    partial: 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
    future: 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600',
    irrelevant: 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600',
  }

  // Tax types for selected month
  const taxTypesForMonth = useMemo(() => {
    if (!vatPayer) return []
    if (vatPeriod === 'quarterly') {
      if (QUARTER_MONTHS.includes(selectedMonth)) {
        return ['dph', 'kontrolni_hlaseni']
      }
      return []
    }
    return ['dph', 'kontrolni_hlaseni', 'souhrnne_hlaseni']
  }, [vatPayer, vatPeriod, selectedMonth])

  const taxByType = useMemo(() => {
    const map: Record<string, TaxFiling | null> = {}
    for (const t of taxTypesForMonth) {
      map[t] = taxFilings.find(f => f.type === t && f.period === selectedPeriod) || null
    }
    return map
  }, [taxFilings, taxTypesForMonth, selectedPeriod])

  const handleTaxToggle = async (type: string) => {
    const current = taxByType[type]
    const currentIdx = current ? TAX_STATUS_CYCLE.indexOf(current.status as any) : -1
    const nextIdx = (currentIdx + 1) % TAX_STATUS_CYCLE.length
    const nextStatus = TAX_STATUS_CYCLE[nextIdx === 0 ? 1 : nextIdx] // skip not_filed on first click, start with in_preparation

    try {
      if (current?.id) {
        // Record exists → always PATCH
        const res = await fetch(`/api/accountant/companies/${companyId}/tax-filings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, status: nextStatus }),
        })
        if (!res.ok) toast.error('Chyba při aktualizaci')
      } else {
        // No record → POST
        const res = await fetch(`/api/accountant/companies/${companyId}/tax-filings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: selectedPeriod, type, status: nextStatus }),
        })
        if (!res.ok) toast.error('Chyba při vytváření')
      }
      fetchTax()
    } catch {
      toast.error('Chyba při změně stavu')
    }
  }

  const handleDocToggleSkipped = async (field: string, currentStatus: string) => {
    if (currentStatus === 'uploaded' || currentStatus === 'approved') return
    const newValue = currentStatus === 'skipped' ? 'missing' : 'skipped'

    try {
      const res = await fetch('/api/accountant/closures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, period: selectedPeriod, field, value: newValue }),
      })
      if (res.ok) {
        toast.success(newValue === 'skipped' ? 'Označeno jako Nesleduje se' : 'Označeno jako chybí')
        fetchAnnual()
      }
    } catch { /* */ }
  }

  const TaxBadge = ({ filing }: { filing: TaxFiling | null }) => {
    if (!filing || filing.status === 'not_filed') return <span className="text-gray-300 dark:text-gray-600">—</span>
    if (filing.status === 'paid') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    if (filing.status === 'filed') return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
    if (filing.status === 'in_preparation') return <Clock className="h-3.5 w-3.5 text-yellow-500" />
    return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
  }

  if (loading && !annualData) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <>
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Row 1: Year nav + month pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[40px] text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= currentYear}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex gap-0.5 ml-1 flex-1">
              {MONTHS.map((name, i) => {
                const mData = annualData?.months[i]
                const status = getStatus(mData, i)
                const disabled = status === 'future' || status === 'irrelevant'
                const selected = selectedMonth === i
                const isCurrent = selectedYear === currentYear && i === currentMonth

                return (
                  <button
                    key={i}
                    onClick={() => !disabled && setSelectedMonth(i)}
                    disabled={disabled}
                    className={`
                      flex-1 py-1 rounded text-[10px] font-semibold leading-none transition-all
                      ${pillColor[status]}
                      ${selected ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-gray-900' : ''}
                      ${isCurrent && !selected ? 'ring-1 ring-purple-300' : ''}
                      ${disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}
                    `}
                    title={`${MONTHS_FULL[i]} ${selectedYear}`}
                  >
                    {name.charAt(0)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Month name + tax status */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {MONTHS_FULL[selectedMonth]} {selectedYear}
            </span>

            {taxTypesForMonth.length > 0 ? (
              <div className="flex items-center gap-1">
                {taxTypesForMonth.map(type => (
                  <button
                    key={type}
                    onClick={() => handleTaxToggle(type)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={`${TAX_LABELS[type]}: klikněte pro změnu stavu`}
                  >
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{TAX_LABELS[type]}</span>
                    <TaxBadge filing={taxByType[type]} />
                  </button>
                ))}
              </div>
            ) : vatPayer && vatPeriod === 'quarterly' ? (
              <span className="text-[10px] text-gray-400">DPH jen kvartálně</span>
            ) : null}
          </div>

          {/* Row 3: Doc categories + upload */}
          <div className="flex items-stretch">
            {DOC_CATEGORIES.map(({ key, field, label, icon: Icon }, idx) => {
              const data = monthData ? (monthData as Record<string, any>)[key] as { status: string; count: number } | undefined : undefined
              const status = data?.status || 'missing'
              const count = data?.count || 0

              const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth
              const bg = status === 'approved'
                ? 'bg-green-50 dark:bg-green-950/30'
                : status === 'uploaded'
                  ? 'bg-yellow-50 dark:bg-yellow-950/30'
                  : status === 'skipped'
                    ? 'bg-gray-50 dark:bg-gray-800/50'
                    : isCurrentMonth
                      ? 'bg-orange-50 dark:bg-orange-950/30'
                      : 'bg-red-50 dark:bg-red-950/30'

              const canToggleSkipped = status === 'missing' || status === 'skipped'

              return (
                <div
                  key={key}
                  className={`flex-1 flex items-center gap-1.5 px-2.5 py-2 ${bg} ${idx < 2 ? 'border-r border-gray-100 dark:border-gray-800' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-tight">{label}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">
                      {status === 'approved' && <span className="text-green-600 dark:text-green-400">{count} ✓</span>}
                      {status === 'uploaded' && <span className="text-yellow-600 dark:text-yellow-400">{count} ⏳</span>}
                      {status === 'skipped' && (
                        <button
                          onClick={() => handleDocToggleSkipped(field, status)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Klikněte pro změnu zpět na Chybí"
                        >
                          —
                        </button>
                      )}
                      {status === 'missing' && (
                        <button
                          onClick={() => handleDocToggleSkipped(field, status)}
                          className={`${isCurrentMonth ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'} hover:text-gray-500 transition-colors`}
                          title="Klikněte pro označení jako Nesleduje se"
                        >
                          {isCurrentMonth ? 'Probíhá' : 'Chybí'}
                        </button>
                      )}
                    </div>
                  </div>
                  {canToggleSkipped && (
                    <button
                      onClick={() => handleDocToggleSkipped(field, status)}
                      className="p-0.5 rounded text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      title={status === 'skipped' ? 'Vrátit na Chybí' : 'Označit jako Nesleduje se'}
                    >
                      <MinusCircle className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}

            {/* Upload button */}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center justify-center w-10 bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-l border-gray-100 dark:border-gray-800 transition-colors"
              title="Nahrát dokument"
            >
              <Paperclip className="h-4 w-4 text-gray-400 hover:text-purple-500 transition-colors" />
            </button>
          </div>
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        companyId={companyId}
        onUploaded={() => fetchAnnual()}
      />
    </>
  )
}
