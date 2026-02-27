'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TAX_FILING_TYPE_LABELS,
  TAX_FILING_STATUS_LABELS,
  TAX_FILING_STATUS_COLORS,
} from '@/lib/types/document-register'
import type { TaxFilingType, TaxFilingStatus } from '@/lib/types/document-register'

interface TaxFilingsTabProps {
  companyId: string
  vatPayer?: boolean
}

type TaxFiling = {
  id: string
  company_id: string
  period: string
  type: string
  status: string
  filing_type: string | null
  filing_reference: string | null
  filed_date: string | null
  amount: number | null
  tax_base: number | null
  deductible: number | null
  paid_date: string | null
  deadline: string | null
  prepared_by: string | null
  filed_by: string | null
  notes: string | null
  document_ids: string[] | null
}

const monthHeaders = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const monthlyTaxTypes: TaxFilingType[] = ['dph', 'kontrolni_hlaseni', 'souhrnne_hlaseni']
const annualTaxTypes: TaxFilingType[] = ['dppo', 'dpfo', 'silnicni_dan', 'dan_z_nemovitosti']

function StatusCell({ status, onClick }: { status: string | null; onClick?: () => void }) {
  if (!status || status === 'not_filed') {
    return (
      <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <span className="text-gray-400 text-xs">—</span>
      </button>
    )
  }
  if (status === 'filed' || status === 'paid') {
    return (
      <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      </button>
    )
  }
  if (status === 'in_preparation') {
    return (
      <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">
        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      </button>
    )
  }
  if (status === 'amended') {
    return (
      <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      </button>
    )
  }
  if (status === 'refund_requested' || status === 'refund_received') {
    return (
      <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
        <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      </button>
    )
  }
  return (
    <button onClick={onClick} className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700">
      <span className="text-xs text-gray-500">{status}</span>
    </button>
  )
}

export function TaxFilingsTab({ companyId, vatPayer = true }: TaxFilingsTabProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [filings, setFilings] = useState<TaxFiling[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFiling, setEditingFiling] = useState<TaxFiling | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchFilings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/tax-filings?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setFilings(data.filings ?? [])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [companyId, year])

  useEffect(() => { fetchFilings() }, [fetchFilings])

  const getFilingForCell = (type: TaxFilingType, month: number): TaxFiling | undefined => {
    const period = `${year}-${String(month + 1).padStart(2, '0')}`
    return filings.find(f => f.type === type && f.period === period)
  }

  const getAnnualFiling = (type: TaxFilingType): TaxFiling | undefined => {
    return filings.find(f => f.type === type && f.period === String(year))
  }

  const handleStatusChange = async (filing: TaxFiling | undefined, type: TaxFilingType, period: string, newStatus: string) => {
    setSavingStatus(true)
    try {
      if (filing) {
        // Update existing
        await fetch(`/api/accountant/companies/${companyId}/tax-filings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: filing.id, status: newStatus }),
        })
      } else {
        // Create new
        await fetch(`/api/accountant/companies/${companyId}/tax-filings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period, type, status: newStatus }),
        })
      }
      fetchFilings()
    } catch { /* ignore */ } finally {
      setSavingStatus(false)
      setEditingFiling(null)
    }
  }

  const handleCellClick = (type: TaxFilingType, month: number) => {
    const filing = getFilingForCell(type, month)
    const period = `${year}-${String(month + 1).padStart(2, '0')}`

    // Cycle through statuses
    const statusCycle = ['not_filed', 'in_preparation', 'filed', 'paid']
    const currentStatus = filing?.status || 'not_filed'
    const currentIndex = statusCycle.indexOf(currentStatus)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

    handleStatusChange(filing, type, period, nextStatus)
  }

  const handleAnnualCellClick = (type: TaxFilingType) => {
    const filing = getAnnualFiling(type)
    const period = String(year)

    const statusCycle = ['not_filed', 'in_preparation', 'filed', 'paid']
    const currentStatus = filing?.status || 'not_filed'
    const currentIndex = statusCycle.indexOf(currentStatus)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

    handleStatusChange(filing, type, period, nextStatus)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setYear(y => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[60px] text-center">
          {year}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setYear(y => y + 1)} disabled={year >= now.getFullYear()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Monthly tax filings grid */}
      {vatPayer && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Měsíční podání</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Typ</th>
                    {monthHeaders.map((m, i) => (
                      <th key={i} className="text-center py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400 w-10">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyTaxTypes.map(type => (
                    <tr key={type} className="border-b dark:border-gray-700">
                      <td className="py-2 px-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {TAX_FILING_TYPE_LABELS[type]}
                      </td>
                      {monthHeaders.map((_, month) => {
                        const filing = getFilingForCell(type, month)
                        const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())
                        return (
                          <td key={month} className="py-2 px-1 text-center">
                            {isFuture ? (
                              <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-800 mx-auto" />
                            ) : (
                              <div className="flex justify-center">
                                <StatusCell
                                  status={filing?.status || null}
                                  onClick={() => handleCellClick(type, month)}
                                />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></span> Podáno/Zaplaceno</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"></span> V přípravě</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700"></span> Dodatečné</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></span> Nepodáno</span>
              <span className="text-gray-400 ml-2">(klikni pro změnu statusu)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annual tax filings */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Roční přiznání</h3>
          <div className="space-y-3">
            {annualTaxTypes.map(type => {
              const filing = getAnnualFiling(type)
              const statusColor = filing?.status ? TAX_FILING_STATUS_COLORS[filing.status as TaxFilingStatus] : null

              return (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {TAX_FILING_TYPE_LABELS[type]} {year}
                      </div>
                      {filing?.deadline && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Termín: {formatDate(filing.deadline)}
                        </div>
                      )}
                      {filing?.filed_date && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Podáno: {formatDate(filing.filed_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {filing?.amount !== null && filing?.amount !== undefined && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(filing.amount)}
                      </span>
                    )}
                    <StatusCell
                      status={filing?.status || null}
                      onClick={() => handleAnnualCellClick(type)}
                    />
                    {filing?.status && statusColor && (
                      <Badge className={`${statusColor.bg} ${statusColor.text} text-xs`}>
                        {TAX_FILING_STATUS_LABELS[filing.status as TaxFilingStatus]}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
