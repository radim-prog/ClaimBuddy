'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  FileX,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Zap,
  Users,
} from 'lucide-react'

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

type Company = {
  id: string
  name: string
  ico: string
}

type Task = {
  id: string
  title: string
  status: string
  due_date?: string | null
  company_id?: string
  company_name?: string | null
}

type MorningOverviewProps = {
  companies: Company[]
  closures: MonthlyClosure[]
  tasks: Task[]
}

export function MorningOverview({ companies, closures, tasks }: MorningOverviewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const companyMap = useMemo(() =>
    new Map(companies.map(c => [c.id, c])),
    [companies]
  )

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Only current and past closures for active companies
  const activeClosures = useMemo(() => {
    const companyIds = new Set(companies.map(c => c.id))
    return closures.filter(c => {
      if (!companyIds.has(c.company_id)) return false
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    })
  }, [closures, companies, currentYear, currentMonth])

  // === SECTION 1: "VYŽADUJE TVOU AKCI" ===

  // Overdue tasks (po termínu)
  const overdueTasks = useMemo(() =>
    tasks.filter(t =>
      t.due_date && t.due_date < today &&
      t.status !== 'completed' && t.status !== 'someday_maybe'
    ),
    [tasks, today]
  )

  // Today's tasks
  const todayTasks = useMemo(() =>
    tasks.filter(t =>
      t.due_date === today &&
      t.status !== 'completed' && t.status !== 'someday_maybe'
    ),
    [tasks, today]
  )

  // Waiting for approval (uploaded docs to review)
  const waitingApproval = useMemo(() =>
    activeClosures.filter(c =>
      (c.bank_statement_status === 'uploaded' ||
       c.expense_documents_status === 'uploaded' ||
       c.income_invoices_status === 'uploaded') &&
      c.bank_statement_status !== 'missing' &&
      c.expense_documents_status !== 'missing' &&
      c.income_invoices_status !== 'missing'
    ),
    [activeClosures]
  )

  // Approaching deadlines (within 3 days, not today)
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0]

  const upcomingTasks = useMemo(() =>
    tasks.filter(t =>
      t.due_date && t.due_date > today && t.due_date <= threeDaysStr &&
      t.status !== 'completed' && t.status !== 'someday_maybe'
    ),
    [tasks, today, threeDaysStr]
  )

  // === SECTION 2: "ČEKÁ NA KLIENTA" (grouped summary) ===

  const missingDocsGrouped = useMemo(() => {
    const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    const currentClosures = activeClosures.filter(c => c.period === currentPeriod)

    const missingBank: string[] = []
    const missingExpense: string[] = []
    const missingIncome: string[] = []

    currentClosures.forEach(c => {
      const company = companyMap.get(c.company_id)
      if (!company) return
      if (c.bank_statement_status === 'missing') missingBank.push(company.name)
      if (c.expense_documents_status === 'missing') missingExpense.push(company.name)
      if (c.income_invoices_status === 'missing') missingIncome.push(company.name)
    })

    return { missingBank, missingExpense, missingIncome }
  }, [activeClosures, companyMap, currentYear, currentMonth])

  const totalMissingCompanies = useMemo(() => {
    const set = new Set<string>()
    const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    activeClosures
      .filter(c => c.period === currentPeriod)
      .forEach(c => {
        if (c.bank_statement_status === 'missing' ||
            c.expense_documents_status === 'missing' ||
            c.income_invoices_status === 'missing') {
          set.add(c.company_id)
        }
      })
    return set.size
  }, [activeClosures, currentYear, currentMonth])

  // === STATS ===
  const myActionCount = overdueTasks.length + todayTasks.length + waitingApproval.length
  const allOk = myActionCount === 0 && totalMissingCompanies === 0

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Summary cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/accountant/tasks" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Dnešní úkoly</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{todayTasks.length}</p>
            </div>
            <ClipboardList className="h-7 w-7 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
        </Link>

        <Link href="/accountant/tasks" className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Blížící se</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{upcomingTasks.length}</p>
            </div>
            <AlertTriangle className="h-7 w-7 text-orange-600 dark:text-orange-400 opacity-50" />
          </div>
        </Link>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Ke schválení</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{waitingApproval.length}</p>
            </div>
            <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Nedodáno</p>
              <p className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">{totalMissingCompanies}</p>
            </div>
            <Users className="h-7 w-7 text-gray-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* All OK state */}
      {allOk && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Vše je v pořádku</p>
            <p className="text-sm text-green-600 dark:text-green-400">Žádné urgentní úkoly ani čekající dokumenty.</p>
          </div>
        </div>
      )}

      {/* === SECTION: VYŽADUJE TVOU AKCI === */}
      {myActionCount > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('action')}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-800 dark:text-red-300 text-sm">Vyžaduje tvou akci</span>
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{myActionCount}</span>
            </div>
            {expandedSection === 'action'
              ? <ChevronUp className="h-4 w-4 text-red-400" />
              : <ChevronDown className="h-4 w-4 text-red-400" />
            }
          </button>

          {expandedSection === 'action' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Overdue tasks */}
              {overdueTasks.slice(0, 5).map(t => {
                const companyName = (t.company_id ? companyMap.get(t.company_id)?.name : null) || t.company_name || null
                return (
                  <Link
                    key={`overdue-${t.id}`}
                    href="/accountant/tasks"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-red-500">Po termínu ({t.due_date})</p>
                    </div>
                    {companyName && (
                      <span className="text-xs text-gray-400 flex-shrink-0 max-w-[140px] truncate">{companyName}</span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                  </Link>
                )
              })}
              {overdueTasks.length > 5 && (
                <Link href="/accountant/tasks" className="block px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-center">
                  + dalších {overdueTasks.length - 5} po termínu
                </Link>
              )}

              {/* Today's tasks */}
              {todayTasks.slice(0, 3).map(t => {
                const companyName = (t.company_id ? companyMap.get(t.company_id)?.name : null) || t.company_name || null
                return (
                  <Link
                    key={`today-${t.id}`}
                    href="/accountant/tasks"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-blue-500">Dnes</p>
                    </div>
                    {companyName && (
                      <span className="text-xs text-gray-400 flex-shrink-0 max-w-[140px] truncate">{companyName}</span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                  </Link>
                )
              })}
              {todayTasks.length > 3 && (
                <Link href="/accountant/tasks" className="block px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center">
                  + dalších {todayTasks.length - 3} dnešních úkolů
                </Link>
              )}

              {/* Waiting for approval - grouped summary */}
              {waitingApproval.length > 0 && (
                <Link
                  href="/accountant/dashboard"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {waitingApproval.length} {waitingApproval.length === 1 ? 'uzávěrka čeká' : waitingApproval.length < 5 ? 'uzávěrky čekají' : 'uzávěrek čeká'} na schválení
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Klient nahrál dokumenty</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* === SECTION: ČEKÁ NA KLIENTA (grouped, not individual) === */}
      {totalMissingCompanies > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('client')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Čeká na klienta</span>
              <span className="bg-gray-400 dark:bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalMissingCompanies}</span>
            </div>
            {expandedSection === 'client'
              ? <ChevronUp className="h-4 w-4 text-gray-400" />
              : <ChevronDown className="h-4 w-4 text-gray-400" />
            }
          </button>

          {expandedSection === 'client' && (
            <div className="px-4 py-3 space-y-2">
              {missingDocsGrouped.missingBank.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileX className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{missingDocsGrouped.missingBank.length}</span> {missingDocsGrouped.missingBank.length === 1 ? 'klient' : missingDocsGrouped.missingBank.length < 5 ? 'klienti' : 'klientů'} nedodalo <span className="font-medium">bankovní výpisy</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                      {missingDocsGrouped.missingBank.slice(0, 4).join(', ')}{missingDocsGrouped.missingBank.length > 4 ? ` a ${missingDocsGrouped.missingBank.length - 4} dalších` : ''}
                    </p>
                  </div>
                </div>
              )}

              {missingDocsGrouped.missingExpense.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileX className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{missingDocsGrouped.missingExpense.length}</span> {missingDocsGrouped.missingExpense.length === 1 ? 'klient' : missingDocsGrouped.missingExpense.length < 5 ? 'klienti' : 'klientů'} nedodalo <span className="font-medium">nákladové doklady</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                      {missingDocsGrouped.missingExpense.slice(0, 4).join(', ')}{missingDocsGrouped.missingExpense.length > 4 ? ` a ${missingDocsGrouped.missingExpense.length - 4} dalších` : ''}
                    </p>
                  </div>
                </div>
              )}

              {missingDocsGrouped.missingIncome.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileX className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{missingDocsGrouped.missingIncome.length}</span> {missingDocsGrouped.missingIncome.length === 1 ? 'klient' : missingDocsGrouped.missingIncome.length < 5 ? 'klienti' : 'klientů'} nedodalo <span className="font-medium">příjmové faktury</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                      {missingDocsGrouped.missingIncome.slice(0, 4).join(', ')}{missingDocsGrouped.missingIncome.length > 4 ? ` a ${missingDocsGrouped.missingIncome.length - 4} dalších` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
