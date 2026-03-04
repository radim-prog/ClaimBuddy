'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  AlertTriangle,
  Inbox,
} from 'lucide-react'

type CompanyDocStatus = {
  company_id: string
  company_name: string
  ico: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
  document_count: number
  missing_types: string[]
  closure_status: string | null
}

type OverviewData = {
  period: string
  companies: CompanyDocStatus[]
  summary: { complete: number; incomplete: number; not_started: number; total: number }
}

const monthNamesFull = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
  if (status === 'uploaded') return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
  return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
}

export default function DocumentsOverviewPage() {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const period = `${year}-${String(month).padStart(2, '0')}`

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/documents/overview?period=${period}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    const maxYear = now.getFullYear()
    const maxMonth = now.getMonth() + 1
    if (year === maxYear && month >= maxMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const isNextDisabled = year === now.getFullYear() && month >= now.getMonth() + 1

  const filteredCompanies = useMemo(() => {
    if (!data) return []
    let companies = data.companies

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      companies = companies.filter(c =>
        c.company_name.toLowerCase().includes(q) ||
        c.ico?.includes(q)
      )
    }

    // Status filter
    if (filter === 'incomplete') {
      companies = companies.filter(c =>
        c.missing_types.length > 0 && c.document_count > 0
      )
    } else if (filter === 'not_started') {
      companies = companies.filter(c =>
        c.missing_types.length === 3 && c.document_count === 0
      )
    } else if (filter === 'complete') {
      companies = companies.filter(c => c.missing_types.length === 0)
    }

    return companies
  }, [data, searchQuery, filter])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const summary = data?.summary || { complete: 0, incomplete: 0, not_started: 0, total: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Přehled dokladů</h1>
          <p className="text-gray-600 dark:text-gray-300">Stav podkladů od klientů</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold font-display text-gray-900 dark:text-white min-w-[140px] text-center">
            {monthNamesFull[month - 1]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth} disabled={isNextDisabled}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover cursor-pointer rounded-xl shadow-soft-sm" onClick={() => setFilter('complete')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-3xl font-bold font-display text-green-600 dark:text-green-400">{summary.complete}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Kompletní</div>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer rounded-xl shadow-soft-sm" onClick={() => setFilter('incomplete')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-3xl font-bold font-display text-yellow-600 dark:text-yellow-400">{summary.incomplete}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nekompletní</div>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer rounded-xl shadow-soft-sm" onClick={() => setFilter('not_started')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-3xl font-bold font-display text-red-600 dark:text-red-400">{summary.not_started}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nezačato</div>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer rounded-xl shadow-soft-sm" onClick={() => setFilter('all')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-3xl font-bold font-display text-gray-900 dark:text-white">{summary.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Celkem firem</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Hledat firmu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-sm h-11"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny firmy</SelectItem>
            <SelectItem value="incomplete">Nekompletní</SelectItem>
            <SelectItem value="not_started">Nezačato</SelectItem>
            <SelectItem value="complete">Kompletní</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies table */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="pt-4">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Žádné firmy odpovídající filtru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Firma</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Výpis</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Náklady</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Příjmy</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Doklady</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => {
                    const allApproved = company.missing_types.length === 0
                    const hasUploads = company.document_count > 0
                    const allMissing = company.missing_types.length === 3 && !hasUploads

                    return (
                      <tr
                        key={company.company_id}
                        className="border-b border-border/50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/accountant/clients/${company.company_id}#documents`)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {company.company_name}
                              </div>
                              {company.ico && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  IČO: {company.ico}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusIcon status={company.bank_statement_status} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusIcon status={company.expense_documents_status} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusIcon status={company.income_invoices_status} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {company.document_count}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {allApproved ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                              Kompletní
                            </Badge>
                          ) : allMissing ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                              Nezačato
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Nekompletní
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border/50 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            Zobrazeno {filteredCompanies.length} z {data?.companies.length || 0} firem
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" /> Schváleno
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-600" /> Nahráno, ke schválení
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-500" /> Chybí
        </span>
      </div>
    </div>
  )
}
