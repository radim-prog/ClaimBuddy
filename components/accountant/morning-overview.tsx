'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  FileX,
  ChevronRight,
  Building2,
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
  const companyMap = useMemo(() =>
    new Map(companies.map(c => [c.id, c])),
    [companies]
  )

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Only current and past closures
  const activeClosures = useMemo(() =>
    closures.filter(c => {
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    }),
    [closures, currentYear, currentMonth]
  )

  // 1. Today's tasks
  const todayTasks = useMemo(() =>
    tasks.filter(t =>
      t.due_date === today &&
      t.status !== 'completed' &&
      t.status !== 'someday_maybe'
    ),
    [tasks, today]
  )

  // 2. Approaching deadlines (within 3 days)
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0]

  const upcomingDeadlines = useMemo(() =>
    tasks.filter(t =>
      t.due_date &&
      t.due_date <= threeDaysStr &&
      t.due_date >= today &&
      t.status !== 'completed' &&
      t.status !== 'someday_maybe'
    ),
    [tasks, today, threeDaysStr]
  )

  // 3. Waiting for approval (uploaded, nothing missing)
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

  // 4. Missing documents
  const missingDocs = useMemo(() => {
    const companiesWithMissing = new Set<string>()
    activeClosures.forEach(c => {
      if (c.bank_statement_status === 'missing' ||
          c.expense_documents_status === 'missing' ||
          c.income_invoices_status === 'missing') {
        companiesWithMissing.add(c.company_id)
      }
    })
    return companiesWithMissing
  }, [activeClosures])

  // Top 5 urgent items
  const urgentItems = useMemo(() => {
    const items: Array<{
      id: string
      title: string
      companyName: string | null
      subtitle: string
      type: 'task' | 'missing' | 'approval'
      companyId?: string
      href: string
    }> = []

    // Overdue tasks
    tasks
      .filter(t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'someday_maybe')
      .slice(0, 3)
      .forEach(t => {
        const companyName = (t.company_id ? companyMap.get(t.company_id)?.name : null) || t.company_name || null
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          companyName,
          subtitle: `Po termínu (${t.due_date})`,
          type: 'task',
          companyId: t.company_id,
          href: '/accountant/tasks',
        })
      })

    // Today's tasks (not overdue)
    tasks
      .filter(t => t.due_date === today && t.status !== 'completed' && t.status !== 'someday_maybe')
      .slice(0, 2)
      .forEach(t => {
        if (items.find(i => i.id === `task-${t.id}`)) return
        const companyName = (t.company_id ? companyMap.get(t.company_id)?.name : null) || t.company_name || null
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          companyName,
          subtitle: 'Dnes',
          type: 'task',
          companyId: t.company_id,
          href: '/accountant/tasks',
        })
      })

    // Current month missing closures
    const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    activeClosures
      .filter(c => c.period === currentPeriod && (
        c.bank_statement_status === 'missing' ||
        c.expense_documents_status === 'missing' ||
        c.income_invoices_status === 'missing'
      ))
      .slice(0, 5)
      .forEach(c => {
        const company = companyMap.get(c.company_id)
        if (!company) return
        const missing: string[] = []
        if (c.bank_statement_status === 'missing') missing.push('výpis')
        if (c.expense_documents_status === 'missing') missing.push('náklady')
        if (c.income_invoices_status === 'missing') missing.push('příjmy')
        items.push({
          id: `closure-${c.id}`,
          title: `Chybí: ${missing.join(', ')}`,
          companyName: company.name,
          subtitle: '',
          type: 'missing',
          companyId: company.id,
          href: `/accountant/clients/${company.id}`,
        })
      })

    return items.slice(0, 5)
  }, [tasks, activeClosures, companyMap, today, currentYear, currentMonth])

  const cards = [
    {
      title: 'Dnešní úkoly',
      count: todayTasks.length,
      icon: ClipboardList,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      href: '/accountant/tasks',
    },
    {
      title: 'Blížící se termíny',
      count: upcomingDeadlines.length,
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      href: '/accountant/tasks',
    },
    {
      title: 'Čeká na schválení',
      count: waitingApproval.length,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      href: '#', // Will be deadlines page later
    },
    {
      title: 'Chybějící podklady',
      count: missingDocs.size,
      icon: FileX,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      href: '#', // Dashboard with missing filter
    },
  ]

  return (
    <div className="mb-6">
      {/* 4 summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map((card) => {
          const Icon = card.icon
          const content = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.count}</p>
              </div>
              <Icon className={`h-8 w-8 ${card.color} opacity-50`} />
            </div>
          )
          const className = `${card.bg} ${card.border} border rounded-lg p-4 transition-all hover:shadow-md`
          return card.href && card.href !== '#' ? (
            <Link key={card.title} href={card.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={card.title} className={className}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
