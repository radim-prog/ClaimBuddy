'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ClosureDetailModal } from '@/components/closure-detail-modal'
// settings context removed — no longer needed on dashboard
import { useAttention } from '@/lib/contexts/attention-context'
import { Clock, AlertTriangle, FileX, MessageCircle, Upload, CheckCircle2, ChevronRight, Receipt } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PaymentMatrix } from '@/components/payment-tracking/payment-matrix'
import { VatMatrix } from '@/components/tax-tracking/vat-matrix'
import { IncomeTaxMatrix } from '@/components/tax-tracking/income-tax-matrix'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

// Sort by surname for people, full name for companies
function getSurnameKey(name: string): string {
  if (/s\.r\.o\.|a\.s\.|spol\.|v\.o\.s\.|k\.s\./i.test(name)) return name.toLowerCase()
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return parts[parts.length - 1].toLowerCase()
  return name.toLowerCase()
}

type StatusType = 'missing' | 'uploaded' | 'approved' | 'future'

type Company = {
  id: string
  name: string
  ico: string
  status?: string
  monthly_reporting?: boolean
  group_name?: string | null
  managing_director?: string | null
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
  notes: string | null
  updated_by: string | null
  updated_at: string
}

type TaskItem = {
  id: string
  title: string
  status: string
  due_date?: string | null
  company_id?: string
  company_name?: string | null
}

type GroupInfo = {
  group_name: string
  billing_company_id: string | null
}

type MatrixData = {
  companies: Company[]
  closures: MonthlyClosure[]
  tasks?: TaskItem[]
  stats: {
    total: number
    missing: number
    uploaded: number
    approved: number
  }
  groups?: GroupInfo[]
}

type TimeSummary = {
  total_minutes: number
  billable_minutes: number
  in_tariff_minutes: number
  billable_amount: number
  entry_count: number
  by_company: Array<{
    company_id: string
    company_name: string
    total_minutes: number
    billable_minutes: number
    billable_amount: number
  }>
}

type GtdTask = {
  id: string
  title: string
  status: string
  due_date?: string | null
  company_id?: string | null
  company_name?: string | null
  score_priority?: string | null
}

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

const monthsShort = [
  'Le', 'Ún', 'Bř', 'Du', 'Kv', 'Čn',
  'Čc', 'Sr', 'Zá', 'Ří', 'Li', 'Pr'
]

const currentMonth = new Date().getMonth() // 0-indexed
const currentYear = new Date().getFullYear()

// Status color mapping - výraznější barvy pro lepší viditelnost
const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  missing: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-600'
  },
  uploaded: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-900',
    border: 'border-yellow-500'
  },
  approved: {
    bg: 'bg-green-500',
    text: 'text-white',
    border: 'border-green-600'
  },
  future: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-400',
    border: 'border-gray-200 dark:border-gray-700'
  }
}

function getMonthStatus(closureMap: Map<string, MonthlyClosure>, companyId: string, monthIndex: number, year: number): StatusType {
  // Zkontrolovat, jestli je měsíc v budoucnosti
  if (year > currentYear || (year === currentYear && monthIndex > currentMonth)) {
    return 'future'
  }

  const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const closure = closureMap.get(`${companyId}:${period}`)

  if (!closure) return 'missing'

  // PRIORITA: Pokud COKOLIV chybí → červená (missing)
  const anyMissing =
    closure.bank_statement_status === 'missing' ||
    closure.expense_documents_status === 'missing' ||
    closure.income_invoices_status === 'missing'

  if (anyMissing) return 'missing'

  // Všechny 3 kategorie musí být approved pro celkový status approved
  const allApproved =
    closure.bank_statement_status === 'approved' &&
    closure.expense_documents_status === 'approved' &&
    closure.income_invoices_status === 'approved'

  if (allApproved) return 'approved'

  // Jinak = něco uploaded, nic nechybí → žlutá
  return 'uploaded'
}

const StatusCell = React.memo(function StatusCell({
  companyId,
  companyName,
  monthIndex,
  closureMap,
  year,
  onCellClick,
  aggregateCompanyIds,
}: {
  companyId: string
  companyName: string
  monthIndex: number
  closureMap: Map<string, MonthlyClosure>
  year: number
  onCellClick: (closure: MonthlyClosure, companyName: string) => void
  aggregateCompanyIds?: string[]
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const tooltipId = `tooltip-${companyId}-${monthIndex}`

  const handleMouseEnter = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setShowAbove(rect.top > window.innerHeight / 2)
    }
    setIsHovered(true)
  }

  const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  // Aggregate mode: worst-case across all group members
  const idsToCheck = aggregateCompanyIds && aggregateCompanyIds.length > 0 ? aggregateCompanyIds : [companyId]

  const aggResult = useMemo(() => {
    // Priority order: missing > uploaded > approved > future
    const priorityMap: Record<StatusType, number> = { missing: 3, uploaded: 2, approved: 1, future: 0 }
    let worstBank: StatusType = 'future'
    let worstExpense: StatusType = 'future'
    let worstIncome: StatusType = 'future'
    let worstOverall: StatusType = 'future'

    for (const cId of idsToCheck) {
      const st = getMonthStatus(closureMap, cId, monthIndex, year)
      if (priorityMap[st] > priorityMap[worstOverall]) worstOverall = st

      const cl = closureMap.get(`${cId}:${period}`)
      const bk = (cl?.bank_statement_status || (st === 'future' ? 'future' : 'missing')) as StatusType
      const ex = (cl?.expense_documents_status || (st === 'future' ? 'future' : 'missing')) as StatusType
      const inc = (cl?.income_invoices_status || (st === 'future' ? 'future' : 'missing')) as StatusType

      if (priorityMap[bk] > priorityMap[worstBank]) worstBank = bk
      if (priorityMap[ex] > priorityMap[worstExpense]) worstExpense = ex
      if (priorityMap[inc] > priorityMap[worstIncome]) worstIncome = inc
    }

    return { status: worstOverall, bank: worstBank, expense: worstExpense, income: worstIncome }
  }, [idsToCheck, closureMap, monthIndex, year, period])

  const status = aggResult.status
  const colors = statusColors[status]

  const closure = closureMap.get(`${companyId}:${period}`)

  // Get individual statuses for the 3 indicators (aggregated if group)
  const bankStatus = aggResult.bank
  const expenseStatus = aggResult.expense
  const incomeStatus = aggResult.income

  const getIndicatorColor = (s: StatusType) => {
    if (s === 'approved') return 'bg-green-400'
    if (s === 'uploaded') return 'bg-yellow-300'
    return 'bg-red-300'
  }

  const getStatusIcon = (s: string) => s === 'approved' ? '✓' : s === 'uploaded' ? '⏳' : '✗'
  const getStatusColor = (s: string) => s === 'approved' ? 'text-green-400' : s === 'uploaded' ? 'text-yellow-400' : 'text-red-400'

  return (
    <td
      ref={cellRef}
      className="px-1 py-2 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {status === 'future' ? (
        <div
          className={`
            w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-lg border-2
            ${colors.bg} ${colors.border}
            flex items-center justify-center
          `}
        >
          <span className={`text-base sm:text-xl ${colors.text}`}>—</span>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-describedby={isHovered ? tooltipId : undefined}
          onClick={() => closure && onCellClick(closure, companyName)}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && closure) { e.preventDefault(); onCellClick(closure, companyName) } }}
          className={`
            w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-lg border-2 transition-all cursor-pointer
            ${colors.bg} ${colors.border}
            hover:scale-110 hover:shadow-soft-lg
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
            flex flex-col items-center justify-center gap-0.5 sm:gap-1
          `}
        >
          <span className={`text-sm sm:text-lg font-bold ${colors.text}`}>
            {status === 'approved' ? '✓' : status === 'uploaded' ? '⏳' : '!'}
          </span>
          <div className="flex gap-0.5">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getIndicatorColor(bankStatus)} border border-white/50`} title="Výpis"></div>
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getIndicatorColor(expenseStatus)} border border-white/50`} title="Náklady"></div>
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getIndicatorColor(incomeStatus)} border border-white/50`} title="Příjmy"></div>
          </div>
        </div>
      )}

      {/* Tooltip - React state based positioning */}
      {status !== 'future' && isHovered && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1">{companyName}</div>
            {aggregateCompanyIds && aggregateCompanyIds.length > 1 && (
              <div className="text-purple-300 mb-1">Skupina ({aggregateCompanyIds.length} firem)</div>
            )}
            <div className="text-gray-300 mb-2">{months[monthIndex]} {year}</div>
            {closure && (
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(closure.bank_statement_status)}>{getStatusIcon(closure.bank_statement_status)}</span>
                  <span>Bankovní výpis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(closure.expense_documents_status)}>{getStatusIcon(closure.expense_documents_status)}</span>
                  <span>Nákladové doklady</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(closure.income_invoices_status)}>{getStatusIcon(closure.income_invoices_status)}</span>
                  <span>Příjmové faktury</span>
                </div>
              </div>
            )}
          </div>
          <div className={`w-3 h-3 bg-gray-900 transform rotate-45 absolute ${showAbove ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'} left-1/2 -translate-x-1/2`}></div>
        </div>
      )}
    </td>
  )
})

// Dashboard tiles removed — using direct compact layout

type OverdueInvoiceStats = {
  count: number
  totalAmount: number
}

type DashboardData = {
  matrix: MatrixData
  todayTasks: GtdTask[]
  timeSummary: TimeSummary | null
  overdueInvoices: OverdueInvoiceStats
}

export default function AccountantDashboard() {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'
  const [filter, setFilter] = useState<'all' | 'missing' | 'uploaded' | 'approved'>('all')
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [selectedClosure, setSelectedClosure] = useState<MonthlyClosure | null>(null)
  const [selectedCompanyName, setSelectedCompanyName] = useState('')

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    const today = new Date().toISOString().split('T')[0]
    const period = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    const [matrixRes, tasksRes, timeRes, overdueRes] = await Promise.all([
      fetch('/api/accountant/matrix'),
      fetch(`/api/tasks?status=inbox,next_action,waiting_for&due_date_to=${today}&sort_by=due_date&sort_order=asc&page_size=20`),
      fetch(`/api/time-entries/summary?period=${period}`),
      fetch('/api/accountant/invoices?overdue=true'),
    ])
    const [matrix, tasksJson, timeJson, overdueJson] = await Promise.all([
      matrixRes.ok ? matrixRes.json() : null,
      tasksRes.ok ? tasksRes.json() : null,
      timeRes.ok ? timeRes.json() : null,
      overdueRes.ok ? overdueRes.json() : null,
    ])

    // Calculate overdue stats from invoices
    const overdueInvoices = (overdueJson?.invoices || []) as Array<{ total_with_vat: number }>
    const overdueStats: OverdueInvoiceStats = {
      count: overdueInvoices.length,
      totalAmount: overdueInvoices.reduce((sum: number, inv: { total_with_vat: number }) => sum + (inv.total_with_vat || 0), 0),
    }

    return {
      matrix: matrix || { companies: [], closures: [], stats: { total: 0, missing: 0, uploaded: 0, approved: 0 } },
      todayTasks: tasksJson?.tasks || [],
      timeSummary: timeJson || null,
      overdueInvoices: overdueStats,
    }
  }, [])

  const { data: dashboardData, loading, refresh } = useCachedFetch('dashboard', fetchDashboard)
  const data = dashboardData?.matrix ?? null
  const todayTasks = dashboardData?.todayTasks ?? []
  const timeSummary = dashboardData?.timeSummary ?? null
  const overdueInvoices = dashboardData?.overdueInvoices ?? { count: 0, totalAmount: 0 }

  const handleCellClick = useCallback((closure: MonthlyClosure, companyName: string) => {
    setSelectedClosure(closure)
    setSelectedCompanyName(companyName)
    setClosureModalOpen(true)
  }, [])

  const handleClosureSave = useCallback(() => {
    refresh()
  }, [refresh])

  // Derived data - MUST be before conditional returns to keep hook order stable
  const allCompanies = data?.companies ?? []
  const closures = data?.closures ?? []
  const closureMap = useMemo(() => {
    const map = new Map<string, MonthlyClosure>()
    for (const c of closures) {
      map.set(`${c.company_id}:${c.period}`, c)
    }
    return map
  }, [closures])
  const stats = data?.stats ?? { total: 0, missing: 0, uploaded: 0, approved: 0 }
  const groups = data?.groups ?? []

  // Group billing map: group_name → billing_company_id (fallback: first company in group)
  const groupBillingMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of groups) {
      if (g.billing_company_id) {
        map.set(g.group_name, g.billing_company_id)
      }
    }
    // Fallback: if no billing entity set, use first company in group
    for (const c of allCompanies) {
      if (c.group_name && !map.has(c.group_name)) {
        map.set(c.group_name, c.id)
      }
    }
    return map
  }, [groups, allCompanies])

  // Group members map: group_name → all company IDs in that group
  const groupMembersMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of allCompanies) {
      if (c.group_name) {
        const arr = map.get(c.group_name) || []
        arr.push(c.id)
        map.set(c.group_name, arr)
      }
    }
    return map
  }, [allCompanies])

  // Exclude inactive clients and those without monthly reporting from dashboard matrix
  // Sort: group_name takes priority, then sort by surname (people) or full name (companies)
  const companies = useMemo(() => {
    const filtered = allCompanies.filter(c => c.status !== 'inactive' && c.monthly_reporting !== false)
    return filtered.sort((a, b) => {
      const aKey = a.group_name?.toLowerCase() || getSurnameKey(a.name)
      const bKey = b.group_name?.toLowerCase() || getSurnameKey(b.name)
      if (aKey !== bKey) return aKey.localeCompare(bKey, 'cs')
      return getSurnameKey(a.name).localeCompare(getSurnameKey(b.name), 'cs')
    })
  }, [allCompanies])

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Filter companies based on selected filter
  const filteredCompanies = useMemo(() => {
    const passesFilter = (companyId: string) => {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const status = getMonthStatus(closureMap, companyId, monthIndex, selectedYear)
        if (filter === status) return true
      }
      return false
    }

    if (filter === 'all') return companies

    // First pass: find companies that pass filter
    const passingIds = new Set(companies.filter(c => passesFilter(c.id)).map(c => c.id))

    // Second pass: if any group member passes, include the billing entity too
    for (const [groupName, memberIds] of groupMembersMap) {
      const anyPasses = memberIds.some(id => passingIds.has(id))
      if (anyPasses) {
        const billingId = groupBillingMap.get(groupName)
        if (billingId) passingIds.add(billingId)
        // Also include all members so the group header renders properly
        memberIds.forEach(id => passingIds.add(id))
      }
    }

    return companies.filter(c => passingIds.has(c.id))
  }, [companies, closureMap, filter, selectedYear, groupMembersMap, groupBillingMap])

  const formatMinutes = useCallback((mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m} min`
    if (m === 0) return `${h} hod`
    return `${h}h ${m}m`
  }, [])

  // Attention data
  const { totals: attentionTotals, loading: attentionLoading } = useAttention()

  // Task counts for compact strip
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return todayTasks.filter(t => t.due_date && t.due_date < today).length
  }, [todayTasks])

  const renderMatrix = useCallback(() => {
    return (
      <>

            {/* Stats + Legend + Filter */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-soft-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => setFilter(filter === 'missing' ? 'all' : 'missing')}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${filter === 'missing' ? 'bg-red-100 ring-2 ring-red-400' : 'hover:bg-red-50 dark:bg-red-900/20'}`}
                  >
                    <div className="w-8 h-8 rounded bg-red-500 border-2 border-red-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-white font-bold">{stats.missing}</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chybí doklady</div>
                      <div className="text-lg font-bold text-red-700 dark:text-red-400">{stats.missing}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setFilter(filter === 'uploaded' ? 'all' : 'uploaded')}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${filter === 'uploaded' ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'hover:bg-yellow-50 dark:bg-yellow-900/20'}`}
                  >
                    <div className="w-8 h-8 rounded bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-yellow-900 font-bold">{stats.uploaded}</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs text-gray-500 dark:text-gray-400">K dokončení</div>
                      <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{stats.uploaded}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
                    className={`border-l pl-3 ml-1 hidden sm:flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer ${filter === 'approved' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                  >
                    <div className="w-8 h-8 rounded bg-green-500 border-2 border-green-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-white font-bold">{stats.approved}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hotovo</div>
                      <div className="text-lg font-bold text-green-700 dark:text-green-400">{stats.approved}</div>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!data) return
                      const header = ['Klient', 'IČO', ...months.map((m) => `${m} ${selectedYear}`)].join(';')
                      const rows = filteredCompanies.map(company => {
                        const statuses = months.map((_, i) => {
                          const status = getMonthStatus(closureMap, company.id, i, selectedYear)
                          return status === 'approved' ? 'OK' : status === 'uploaded' ? 'Čeká' : status === 'missing' ? 'Chybí' : '-'
                        })
                        return [company.name, company.ico, ...statuses].join(';')
                      })
                      const csv = '\uFEFF' + [header, ...rows].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `matice-${selectedYear}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-200"
                  >
                    Export CSV
                  </button>

                  {filter !== 'all' && (
                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                        Zobrazeno: {filteredCompanies.length} z {companies.length} klientů
                      </span>
                      <button
                        onClick={() => setFilter('all')}
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        Zrušit filtr
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Master Matrix Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '600px' }}>
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-purple-600 z-10 max-w-[100px] sm:max-w-none">
                      Klient
                    </th>
                    {months.map((month, index) => (
                      <th
                        key={index}
                        className={`px-1 sm:px-2 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                          index === currentMonth && selectedYear === currentYear
                            ? 'bg-white/20 text-white font-bold ring-2 ring-white/50 rounded'
                            : 'text-white'
                        }`}
                      >
                        <span className="hidden sm:inline">{month}</span>
                        <span className="sm:hidden">{monthsShort[index]}</span>
                        {index === currentMonth && selectedYear === currentYear && (
                          <div className="text-xs font-normal">●</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400" aria-live="polite">
                        Žádní klienti neodpovídají filtru
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company, companyIndex) => {
                      const prevCompany = companyIndex > 0 ? filteredCompanies[companyIndex - 1] : null
                      const currentGroup = company.group_name || null
                      const prevGroup = prevCompany?.group_name || null
                      const showGroupHeader = currentGroup && currentGroup !== prevGroup
                      const isCollapsed = currentGroup ? collapsedGroups.has(currentGroup) : false
                      const billingEntityId = currentGroup ? groupBillingMap.get(currentGroup) : null
                      const isBillingEntity = billingEntityId === company.id
                      const groupMembers = currentGroup ? (groupMembersMap.get(currentGroup) || []) : []

                      // Collapsed logic:
                      // - Show group header always
                      // - Show billing entity row with aggregated data + badge
                      // - Skip all other group members
                      if (currentGroup && isCollapsed && !showGroupHeader && !isBillingEntity) return null

                      return (
                        <React.Fragment key={company.id}>
                          {showGroupHeader && (
                            <tr
                              className="bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border-t-2 border-t-purple-200 dark:border-t-purple-800"
                              onClick={() => setCollapsedGroups(prev => {
                                const next = new Set(prev)
                                if (next.has(currentGroup!)) next.delete(currentGroup!)
                                else next.add(currentGroup!)
                                return next
                              })}
                            >
                              <td colSpan={13} className="px-2 sm:px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20 select-none">
                                <span className="inline-flex items-center gap-2">
                                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                                  {currentGroup}
                                  <span className="text-[10px] font-normal text-purple-500 dark:text-purple-400">
                                    {groupMembers.length} firem
                                  </span>
                                </span>
                              </td>
                            </tr>
                          )}
                          {(!isCollapsed || isBillingEntity) && (
                          <tr className={`${companyIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'} ${currentGroup ? 'border-l-2 border-l-purple-300 dark:border-l-purple-700' : ''}`}>
                            <td className={`px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 z-10 max-w-[100px] sm:max-w-none ${companyIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                              <Link href={`/accountant/clients/${company.id}`} className="hover:text-purple-600 transition-colors">
                                <div>
                                  <div className="font-semibold truncate">
                                    {company.name}
                                    {isCollapsed && isBillingEntity && groupMembers.length > 1 && (
                                      <span className="ml-1.5 text-[10px] font-normal text-purple-500 dark:text-purple-400 align-middle">
                                        ({groupMembers.length} firem)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                    IČO: {company.ico}
                                    {company.managing_director && ` • ${company.managing_director}`}
                                  </div>
                                </div>
                              </Link>
                            </td>
                        {months.map((_, monthIndex) => (
                          <StatusCell
                            key={monthIndex}
                            companyId={company.id}
                            companyName={isCollapsed && isBillingEntity ? (currentGroup || company.name) : company.name}
                            monthIndex={monthIndex}
                            closureMap={closureMap}
                            year={selectedYear}
                            onCellClick={handleCellClick}
                            aggregateCompanyIds={isCollapsed && isBillingEntity && groupMembers.length > 1 ? groupMembers : undefined}
                          />
                        ))}
                          </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
  }, [companies, closures, selectedYear, filter, filteredCompanies, stats, data, handleCellClick, collapsedGroups, groupBillingMap, groupMembersMap, closureMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const monthName = new Date().toLocaleDateString('cs-CZ', { month: 'long' })

  return (
    <div className="min-w-0 overflow-hidden space-y-5">

      {/* Ultra-compact status bar */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400 px-1">
        <Link href="/accountant/work" className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
          <Clock className="h-3.5 w-3.5 text-purple-500" />
          <span className="font-medium text-gray-900 dark:text-white">{todayTasks.length}</span> úkolů
          {overdueCount > 0 && <span className="text-red-500 font-medium">({overdueCount} po termínu)</span>}
        </Link>
        <span className="text-gray-200 dark:text-gray-700">|</span>
        {attentionLoading ? (
          <span>...</span>
        ) : attentionTotals.total === 0 ? (
          <Link href="/accountant/clients" className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" /> OK
          </Link>
        ) : (
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {attentionTotals.missing_documents > 0 && <Link href="/accountant/clients" className="flex items-center gap-0.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"><FileX className="h-3 w-3" />{attentionTotals.missing_documents}</Link>}
            {attentionTotals.unread_messages > 0 && <Link href="/accountant/komunikace" className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"><MessageCircle className="h-3 w-3" />{attentionTotals.unread_messages}</Link>}
            {attentionTotals.pending_uploads > 0 && <Link href="/accountant/clients" className="flex items-center gap-0.5 text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors"><Upload className="h-3 w-3" />{attentionTotals.pending_uploads}</Link>}
          </span>
        )}
        <span className="text-gray-200 dark:text-gray-700">|</span>
        {overdueInvoices.count > 0 && (
          <>
            <Link href="/accountant/invoices?filter=overdue" className="flex items-center gap-1.5 hover:text-red-600 transition-colors">
              <Receipt className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-600 dark:text-red-400">{overdueInvoices.count}</span>
              <span className="text-red-500">po splatnosti</span>
              <span className="text-red-600 dark:text-red-400 font-medium">({Math.round(overdueInvoices.totalAmount).toLocaleString('cs-CZ')} Kč)</span>
            </Link>
            <span className="text-gray-200 dark:text-gray-700">|</span>
          </>
        )}
        <Link href="/accountant/invoicing" className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          {!timeSummary || timeSummary.entry_count === 0 ? (
            <span>0h {monthName}</span>
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-white">{formatMinutes(timeSummary.total_minutes)}</span>
              <span>{monthName}</span>
              {isAdmin && timeSummary.billable_amount > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">{Math.round(timeSummary.billable_amount).toLocaleString('cs-CZ')} Kč</span>
              )}
            </>
          )}
        </Link>
      </div>

      {/* Header row: title | tabs | year selector */}
      <Tabs defaultValue="closures">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold font-display tracking-tight text-gray-900 dark:text-white">Master Matice {selectedYear}</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Přehled uzávěrek a plateb klientů
            </p>
          </div>

          <TabsList>
            <TabsTrigger value="closures">Uzávěrky</TabsTrigger>
            <TabsTrigger value="payments">Platby</TabsTrigger>
            <TabsTrigger value="vat">DPH</TabsTrigger>
            <TabsTrigger value="income-tax">Daň z příjmu</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedYear <= 2020}
            >
              ←
            </button>
            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-lg min-w-[64px] text-center text-sm">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedYear >= currentYear + 1}
            >
              →
            </button>
          </div>
        </div>

        <TabsContent value="closures">
          {renderMatrix()}
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMatrix selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="vat">
          <VatMatrix selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="income-tax">
          <IncomeTaxMatrix selectedYear={selectedYear} />
        </TabsContent>
      </Tabs>

      {/* Closure Detail Modal */}
      <ClosureDetailModal
        open={closureModalOpen}
        onOpenChange={setClosureModalOpen}
        closure={selectedClosure}
        companyName={selectedCompanyName}
        onSave={handleClosureSave}
      />
    </div>
  )
}
