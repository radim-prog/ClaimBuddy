'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
// DeadlineDashboardWidget odstraněn - používáme globální alert bar v layoutu

type StatusType = 'missing' | 'uploaded' | 'approved' | 'future'

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
    bg: 'bg-gray-100',
    text: 'text-gray-400',
    border: 'border-gray-200'
  }
}

function getMonthStatus(closures: MonthlyClosure[], companyId: string, monthIndex: number, year: number): StatusType {
  // Zkontrolovat, jestli je měsíc v budoucnosti
  if (year > currentYear || (year === currentYear && monthIndex > currentMonth)) {
    return 'future'
  }

  const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

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
    // Extended details for expandable view
    description?: string
    checklist?: Array<{ id: string; label: string; completed: boolean }>
    assignedTo?: string
    attachments?: Array<{ name: string; url: string }>
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
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      if (closure.bank_statement_status === 'missing') {
        missingDocs.push('výpis')
        checklist.push({ id: `${closure.id}-bank`, label: 'Výpis z banky', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-bank`, label: 'Výpis z banky', completed: true })
      }

      if (closure.expense_documents_status === 'missing') {
        missingDocs.push('náklady')
        checklist.push({ id: `${closure.id}-expense`, label: 'Nákladové doklady', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-expense`, label: 'Nákladové doklady', completed: true })
      }

      if (closure.income_invoices_status === 'missing') {
        missingDocs.push('příjmy')
        checklist.push({ id: `${closure.id}-income`, label: 'Příjmové faktury', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-income`, label: 'Příjmové faktury', completed: true })
      }

      deadlines.push({
        id: `${closure.id}-missing`,
        title: `Uzávěrka ${months[month - 1]} - chybí ${missingDocs.join(', ')}`,
        dueDate: deadline.toISOString(),
        type: daysUntil < 0 ? 'critical' : daysUntil <= 2 ? 'critical' : 'urgent',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name,
        description: `Měsíční uzávěrka za ${months[month - 1]} ${year} pro firmu ${company.name}. Klient musí dodat chybějící dokumenty do ${deadline.toLocaleDateString('cs-CZ')}.`,
        checklist,
        assignedTo: 'Jana Svobodová'
      })
    }

    if (hasUploaded && !hasMissing && daysUntil <= 14) {
      // Urgent: uploaded documents waiting for approval
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      checklist.push({
        id: `${closure.id}-review-bank`,
        label: 'Zkontrolovat výpis z banky',
        completed: closure.bank_statement_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-review-expense`,
        label: 'Zkontrolovat nákladové doklady',
        completed: closure.expense_documents_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-review-income`,
        label: 'Zkontrolovat příjmové faktury',
        completed: closure.income_invoices_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-approve`,
        label: 'Schválit celou uzávěrku',
        completed: false
      })

      // Mock attachments for uploaded documents
      const attachments: Array<{ name: string; url: string }> = []
      if (closure.bank_statement_status === 'uploaded') {
        attachments.push({ name: `vypis_${months[month - 1]}_2025.pdf`, url: '#' })
      }
      if (closure.expense_documents_status === 'uploaded') {
        attachments.push({ name: `naklady_${months[month - 1]}_2025.zip`, url: '#' })
      }
      if (closure.income_invoices_status === 'uploaded') {
        attachments.push({ name: `prijmy_${months[month - 1]}_2025.pdf`, url: '#' })
      }

      deadlines.push({
        id: `${closure.id}-approval`,
        title: `Uzávěrka ${months[month - 1]} - čeká na schválení`,
        dueDate: deadline.toISOString(),
        type: daysUntil <= 3 ? 'urgent' : 'warning',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name,
        description: `Klient ${company.name} nahrál všechny dokumenty pro uzávěrku za ${months[month - 1]} ${year}. Je třeba zkontrolovat a schválit.`,
        checklist,
        assignedTo: 'Jana Svobodová',
        attachments
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
    companyId?: string
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
  closures,
  year
}: {
  companyId: string
  companyName: string
  monthIndex: number
  closures: MonthlyClosure[]
  year: number
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

  const status = getMonthStatus(closures, companyId, monthIndex, year)
  const colors = statusColors[status]
  const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

  // Get individual statuses for the 3 indicators
  const bankStatus = closure?.bank_statement_status || 'missing'
  const expenseStatus = closure?.expense_documents_status || 'missing'
  const incomeStatus = closure?.income_invoices_status || 'missing'

  const getIndicatorColor = (s: StatusType) => {
    if (s === 'approved') return 'bg-green-400'
    if (s === 'uploaded') return 'bg-yellow-300'
    return 'bg-red-300'
  }

  return (
    <td
      ref={cellRef}
      className="px-1 py-2 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {status === 'future' ? (
        // Budoucí měsíc - bez linku, šedý
        <div
          className={`
            w-14 h-14 mx-auto rounded-lg border-2
            ${colors.bg} ${colors.border}
            flex items-center justify-center
          `}
        >
          <span className={`text-xl ${colors.text}`}>—</span>
        </div>
      ) : (
        <Link href={`/accountant/clients/${companyId}`}>
          <div
            className={`
              w-14 h-14 mx-auto rounded-lg border-2 transition-all cursor-pointer
              ${colors.bg} ${colors.border}
              hover:scale-110 hover:shadow-lg
              flex flex-col items-center justify-center gap-1
            `}
          >
            {/* Hlavní ikona */}
            <span className={`text-lg font-bold ${colors.text}`}>
              {status === 'approved' ? '✓' : status === 'uploaded' ? '⏳' : '!'}
            </span>
            {/* 3 malé tečky pro jednotlivé dokumenty */}
            <div className="flex gap-0.5">
              <div className={`w-2 h-2 rounded-full ${getIndicatorColor(bankStatus)} border border-white/50`} title="Výpis"></div>
              <div className={`w-2 h-2 rounded-full ${getIndicatorColor(expenseStatus)} border border-white/50`} title="Náklady"></div>
              <div className={`w-2 h-2 rounded-full ${getIndicatorColor(incomeStatus)} border border-white/50`} title="Příjmy"></div>
            </div>
          </div>
        </Link>
      )}

      {/* Tooltip - smart positioning with direct DOM manipulation */}
      {status !== 'future' && (
        <div ref={tooltipRef} className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1">{companyName}</div>
            <div className="text-gray-300 mb-2">{months[monthIndex]} {year}</div>
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
      )}
    </td>
  )
}

export default function AccountantDashboard() {
  const [data, setData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [filter, setFilter] = useState<'all' | 'missing' | 'uploaded'>('all')

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

  // Generate deadline tasks - MUST be before conditional returns (Rules of Hooks)
  const deadlineTasks = useMemo(() => {
    if (!data) return []
    return generateDeadlineTasks(data.closures, data.companies)
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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

  // Filter companies based on selected filter
  const filteredCompanies = companies.filter(company => {
    if (filter === 'all') return true

    // Check all months for this company in selected year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const status = getMonthStatus(closures, company.id, monthIndex, selectedYear)
      if (filter === 'missing' && status === 'missing') return true
      if (filter === 'uploaded' && status === 'uploaded') return true
    }
    return false
  })

  return (
    <div>
      {/* Header with year selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Matice {selectedYear}</h1>
          <p className="mt-1 text-gray-600">
            Přehled všech klientů a stavu jejich měsíčních uzávěrek
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedYear <= 2025}
          >
            ←
          </button>
          <span className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-lg min-w-[80px] text-center">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedYear >= currentYear + 1}
          >
            →
          </button>
        </div>
      </div>

      {/* Stats + Legend + Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats as clickable filters - pouze problémové položky */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter(filter === 'missing' ? 'all' : 'missing')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${filter === 'missing' ? 'bg-red-100 ring-2 ring-red-400' : 'hover:bg-red-50'}`}
            >
              <div className="w-8 h-8 rounded bg-red-500 border-2 border-red-600 flex items-center justify-center">
                <span className="text-sm text-white font-bold">!</span>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">Chybí podklady</div>
                <div className="text-lg font-bold text-red-700">{stats.missing}</div>
              </div>
            </button>
            <button
              onClick={() => setFilter(filter === 'uploaded' ? 'all' : 'uploaded')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${filter === 'uploaded' ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'hover:bg-yellow-50'}`}
            >
              <div className="w-8 h-8 rounded bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center">
                <span className="text-sm text-yellow-900 font-bold">⏳</span>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">Čeká na schválení</div>
                <div className="text-lg font-bold text-yellow-700">{stats.uploaded}</div>
              </div>
            </button>

            {/* Legenda - pouze vizuální vysvětlení barev */}
            <div className="border-l pl-4 ml-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> OK
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gray-200"></span> Budoucí
              </span>
            </div>
          </div>

          {/* Filter indicator */}
          {filter !== 'all' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Zobrazeno: {filteredCompanies.length} z {companies.length} klientů
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                ✕ Zrušit filtr
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Master Matrix Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-purple-600 z-10">
                Klient
              </th>
              {months.map((month, index) => (
                <th
                  key={index}
                  className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                    index === currentMonth && selectedYear === currentYear
                      ? 'bg-white/20 text-white ring-2 ring-white/50 rounded'
                      : 'text-white'
                  }`}
                >
                  {month}
                  {index === currentMonth && selectedYear === currentYear && (
                    <div className="text-[10px] font-normal">●</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center text-gray-500">
                  Žádní klienti neodpovídají filtru
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company, companyIndex) => (
                <tr key={company.id} className={companyIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                    <Link href={`/accountant/clients/${company.id}`} className="hover:text-purple-600 transition-colors">
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
                      year={selectedYear}
                    />
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
