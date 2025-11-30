'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { DeadlineAlertBar } from '@/components/deadline-alert-bar'
import { DeadlineDashboardWidget } from '@/components/deadline-dashboard-widget'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  ico: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
}

type MatrixData = {
  companies: Company[]
  closures: MonthlyClosure[]
  stats: {
    total: number
    missing: number
    uploaded: number
    approved: number
  }
}

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

// Status color mapping
const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  missing: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300'
  },
  uploaded: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  }
}

function getMonthStatus(closures: MonthlyClosure[], companyId: string, monthIndex: number): StatusType {
  const period = `2025-${String(monthIndex + 1).padStart(2, '0')}`
  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

  if (!closure) return 'missing'

  // Všechny 3 kategorie musí být approved pro celkový status approved
  const allApproved =
    closure.bank_statement_status === 'approved' &&
    closure.expense_documents_status === 'approved' &&
    closure.income_invoices_status === 'approved'

  if (allApproved) return 'approved'

  // Pokud alespoň jedna kategorie je uploaded
  const anyUploaded =
    closure.bank_statement_status === 'uploaded' ||
    closure.expense_documents_status === 'uploaded' ||
    closure.income_invoices_status === 'uploaded'

  if (anyUploaded) return 'uploaded'

  return 'missing'
}

// Generate deadline alerts from closures
function generateDeadlines(closures: MonthlyClosure[], companies: Company[]) {
  const deadlines: Array<{
    id: string
    title: string
    dueDate: string
    type: 'critical' | 'urgent' | 'warning'
    caseId?: string
    companyId?: string
    companyName?: string
  }> = []

  const now = new Date()

  closures.forEach(closure => {
    const company = companies.find(c => c.id === closure.company_id)
    if (!company) return

    // Parse period (e.g., "2025-01")
    const [year, month] = closure.period.split('-').map(Number)

    // Deadline is typically 15th of the following month
    const deadline = new Date(year, month, 15) // month is already 1-indexed in Date constructor
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Check if any documents are missing
    const hasMissing =
      closure.bank_statement_status === 'missing' ||
      closure.expense_documents_status === 'missing' ||
      closure.income_invoices_status === 'missing'

    const hasUploaded =
      closure.bank_statement_status === 'uploaded' ||
      closure.expense_documents_status === 'uploaded' ||
      closure.income_invoices_status === 'uploaded'

    if (hasMissing && daysUntil <= 7) {
      // Critical: missing documents with approaching deadline
      const missingDocs: string[] = []
      if (closure.bank_statement_status === 'missing') missingDocs.push('výpis')
      if (closure.expense_documents_status === 'missing') missingDocs.push('náklady')
      if (closure.income_invoices_status === 'missing') missingDocs.push('příjmy')

      deadlines.push({
        id: `${closure.id}-missing`,
        title: `Uzávěrka ${months[month - 1]} - chybí ${missingDocs.join(', ')}`,
        dueDate: deadline.toISOString(),
        type: daysUntil < 0 ? 'critical' : daysUntil <= 2 ? 'critical' : 'urgent',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name
      })
    }

    if (hasUploaded && !hasMissing && daysUntil <= 14) {
      // Urgent: uploaded documents waiting for approval
      deadlines.push({
        id: `${closure.id}-approval`,
        title: `Uzávěrka ${months[month - 1]} - čeká na schválení`,
        dueDate: deadline.toISOString(),
        type: daysUntil <= 3 ? 'urgent' : 'warning',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name
      })
    }
  })

  // Sort by urgency: critical first, then by date
  return deadlines.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1
    if (a.type !== 'critical' && b.type === 'critical') return 1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

// Generate deadline tasks for dashboard widget
function generateDeadlineTasks(closures: MonthlyClosure[], companies: Company[]) {
  const tasks: Array<{
    id: string
    title: string
    dueDate: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    status: 'overdue' | 'today' | 'this-week' | 'later'
    companyName?: string
    assignedTo?: string
  }> = []

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  closures.forEach(closure => {
    const company = companies.find(c => c.id === closure.company_id)
    if (!company) return

    const [year, month] = closure.period.split('-').map(Number)
    const deadline = new Date(year, month, 15)
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const hasMissing =
      closure.bank_statement_status === 'missing' ||
      closure.expense_documents_status === 'missing' ||
      closure.income_invoices_status === 'missing'

    const hasUploaded =
      closure.bank_statement_status === 'uploaded' ||
      closure.expense_documents_status === 'uploaded' ||
      closure.income_invoices_status === 'uploaded'

    if (hasMissing || hasUploaded) {
      let status: 'overdue' | 'today' | 'this-week' | 'later'
      let priority: 'critical' | 'high' | 'medium' | 'low'

      if (daysUntil < 0) {
        status = 'overdue'
        priority = 'critical'
      } else if (daysUntil === 0) {
        status = 'today'
        priority = 'critical'
      } else if (daysUntil <= 7) {
        status = 'this-week'
        priority = hasMissing ? 'high' : 'medium'
      } else {
        status = 'later'
        priority = hasMissing ? 'medium' : 'low'
      }

      const missingDocs: string[] = []
      if (closure.bank_statement_status === 'missing') missingDocs.push('výpis')
      if (closure.expense_documents_status === 'missing') missingDocs.push('náklady')
      if (closure.income_invoices_status === 'missing') missingDocs.push('příjmy')

      const title = hasMissing
        ? `${months[month - 1]} - chybí ${missingDocs.join(', ')}`
        : `${months[month - 1]} - schválit dokumenty`

      tasks.push({
        id: closure.id,
        title,
        dueDate: deadline.toISOString(),
        priority,
        status,
        companyId: company.id,
        companyName: company.name,
        assignedTo: 'Jana Svobodová'
      })
    }
  })

  return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

function StatusCell({
  companyId,
  companyName,
  monthIndex,
  closures
}: {
  companyId: string
  companyName: string
  monthIndex: number
  closures: MonthlyClosure[]
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (!cellRef.current || !tooltipRef.current || !arrowRef.current) return

    const rect = cellRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // If cell is in bottom half of viewport, show tooltip above
    if (rect.top > viewportHeight / 2) {
      // Show above
      tooltipRef.current.className = 'absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 block z-50 pointer-events-none'
      arrowRef.current.className = 'w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full -mt-1.5 left-1/2 -translate-x-1/2'
    } else {
      // Show below
      tooltipRef.current.className = 'absolute top-full mt-2 left-1/2 transform -translate-x-1/2 block z-50 pointer-events-none'
      arrowRef.current.className = 'w-3 h-3 bg-gray-900 transform rotate-45 absolute bottom-full -mb-1.5 left-1/2 -translate-x-1/2'
    }
  }

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.className = tooltipRef.current.className.replace('block', 'hidden')
    }
  }

  const status = getMonthStatus(closures, companyId, monthIndex)
  const colors = statusColors[status]
  const period = `2025-${String(monthIndex + 1).padStart(2, '0')}`

  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

  return (
    <td
      ref={cellRef}
      className="px-2 py-2 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/accountant/clients/${companyId}`}>
        <div
          className={`
            w-12 h-12 mx-auto rounded-lg border-2 transition-all cursor-pointer
            ${colors.bg} ${colors.border}
            hover:scale-110 hover:shadow-lg
            flex items-center justify-center
          `}
        >
        <span className={`text-xs font-semibold ${colors.text}`}>
          {status === 'approved' ? '✓' : status === 'uploaded' ? '⏳' : '!'}
        </span>
        </div>
      </Link>

      {/* Tooltip - smart positioning with direct DOM manipulation */}
      <div ref={tooltipRef} className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden z-50 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
          <div className="font-bold mb-1">{companyName}</div>
          <div className="text-gray-300 mb-2">{months[monthIndex]} 2025</div>
          {closure && (
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className={closure.bank_statement_status === 'approved' ? 'text-green-400' : closure.bank_statement_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                  {closure.bank_statement_status === 'approved' ? '✓' : closure.bank_statement_status === 'uploaded' ? '⏳' : '✗'}
                </span>
                <span>Výpis z banky</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={closure.expense_documents_status === 'approved' ? 'text-green-400' : closure.expense_documents_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                  {closure.expense_documents_status === 'approved' ? '✓' : closure.expense_documents_status === 'uploaded' ? '⏳' : '✗'}
                </span>
                <span>Nákladové doklady</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={closure.income_invoices_status === 'approved' ? 'text-green-400' : closure.income_invoices_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                  {closure.income_invoices_status === 'approved' ? '✓' : closure.income_invoices_status === 'uploaded' ? '⏳' : '✗'}
                </span>
                <span>Příjmové faktury</span>
              </div>
            </div>
          )}
        </div>
        {/* Arrow */}
        <div ref={arrowRef} className="w-3 h-3 bg-gray-900 transform rotate-45 absolute bottom-full -mb-1.5 left-1/2 -translate-x-1/2"></div>
      </div>
    </td>
  )
}

export default function AccountantDashboard() {
  const [data, setData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accountant/matrix')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate deadline alerts and tasks - MUST be before conditional returns (Rules of Hooks)
  const urgentDeadlines = useMemo(() => {
    if (!data) return []
    return generateDeadlines(data.closures, data.companies)
  }, [data])

  const deadlineTasks = useMemo(() => {
    if (!data) return []
    return generateDeadlineTasks(data.closures, data.companies)
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám Master Matici...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Nepodařilo se načíst data: {error || 'Neznámá chyba'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { companies, closures, stats } = data

  return (
    <div>
      {/* Deadline Alert Bar - First thing user sees */}
      {urgentDeadlines.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-6">
          <DeadlineAlertBar deadlines={urgentDeadlines} />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Master Matice 2025</h1>
        <p className="mt-2 text-gray-600">
          Přehled všech klientů a stavu jejich měsíčních uzávěrek
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-300 flex items-center justify-center">
            <span className="text-xs text-red-700">!</span>
          </div>
          <span className="text-sm text-gray-700">Chybí dokumenty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center">
            <span className="text-xs text-yellow-700">⏳</span>
          </div>
          <span className="text-sm text-gray-700">Nahrané, čeká na schválení</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-300 flex items-center justify-center">
            <span className="text-xs text-green-700">✓</span>
          </div>
          <span className="text-sm text-gray-700">Schváleno</span>
        </div>
      </div>

      {/* Master Matrix Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-gradient-to-r from-blue-600 to-purple-600 z-10">
                Klient
              </th>
              {months.map((month, index) => (
                <th key={index} className="px-2 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company, companyIndex) => (
              <tr key={company.id} className={companyIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                  <Link href={`/accountant/clients/${company.id}`} className="hover:text-blue-600 transition-colors">
                    <div>
                      <div className="font-semibold">{company.name}</div>
                      <div className="text-xs text-gray-500">IČO: {company.ico}</div>
                    </div>
                  </Link>
                </td>
                {months.map((_, monthIndex) => (
                  <StatusCell
                    key={monthIndex}
                    companyId={company.id}
                    companyName={company.name}
                    monthIndex={monthIndex}
                    closures={closures}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deadline Widget and Stats */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadline Widget - takes 1 column */}
        <div className="lg:col-span-1" id="deadline-widget">
          <DeadlineDashboardWidget tasks={deadlineTasks} />
        </div>

        {/* Stats - take 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="text-2xl text-red-600">!</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Chybějící dokumenty</p>
                <p className="text-2xl font-bold text-gray-900">{stats.missing}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <span className="text-2xl text-yellow-600">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Čeká na schválení</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uploaded}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Schváleno</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
