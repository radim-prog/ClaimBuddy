'use client'

import { useMemo, useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Wallet,
  Building2,
  FileText,
  Loader2,
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { cs } from 'date-fns/locale'

interface Deadline {
  id: string
  title: string
  date: string
  type: 'dph' | 'dan' | 'pojisteni' | 'mzdy' | 'uzaverka' | 'ostatni'
  description?: string
  completed?: boolean
}

interface AccountantDeadlineCalendarProps {
  companyId: string
  companyName?: string
  vatPeriod?: string | null // 'monthly' | 'quarterly' | null
  hasEmployees?: boolean
  entityType?: string | null // 'sro' | 'osvc' | 'as'
}

/**
 * Generate statutory deadlines based on company parameters.
 * Uses real Czech tax law deadlines - no mock data.
 */
function generateStatutoryDeadlines(
  vatPeriod: string | null | undefined,
  hasEmployees: boolean,
  entityType: string | null | undefined,
): Deadline[] {
  const now = new Date()
  const year = now.getFullYear()
  const deadlines: Deadline[] = []

  // Generate deadlines for current month and next 2 months
  for (let offset = 0; offset < 3; offset++) {
    const m = now.getMonth() + offset
    const monthDate = new Date(year, m, 1)
    const monthStr = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'LLLL yyyy', { locale: cs })

    // DPH - 25th of month following the tax period
    if (vatPeriod === 'monthly') {
      deadlines.push({
        id: `dph-${monthStr}`,
        title: `DPH přiznání za ${format(new Date(year, m - 1, 1), 'LLLL', { locale: cs })}`,
        date: format(new Date(year, m, 25), 'yyyy-MM-dd'),
        type: 'dph',
        description: 'Měsíční přiznání k DPH (§101a ZDPH)',
      })
    } else if (vatPeriod === 'quarterly' && (m % 3 === 0)) {
      deadlines.push({
        id: `dph-q-${monthStr}`,
        title: `DPH přiznání za Q${Math.ceil(m / 3)}`,
        date: format(new Date(year, m, 25), 'yyyy-MM-dd'),
        type: 'dph',
        description: 'Čtvrtletní přiznání k DPH (§101a ZDPH)',
      })
    }

    // Kontrolní hlášení (monthly for s.r.o./a.s., quarterly for OSVČ)
    if (vatPeriod) {
      if (entityType === 'osvc') {
        if (m % 3 === 0) {
          deadlines.push({
            id: `kh-${monthStr}`,
            title: `Kontrolní hlášení za Q${Math.ceil(m / 3)}`,
            date: format(new Date(year, m, 25), 'yyyy-MM-dd'),
            type: 'dph',
            description: 'Kontrolní hlášení OSVČ (§101c ZDPH)',
          })
        }
      } else {
        deadlines.push({
          id: `kh-${monthStr}`,
          title: `Kontrolní hlášení za ${format(new Date(year, m - 1, 1), 'LLLL', { locale: cs })}`,
          date: format(new Date(year, m, 25), 'yyyy-MM-dd'),
          type: 'dph',
          description: 'Kontrolní hlášení PO (§101c ZDPH)',
        })
      }
    }

    // Mzdy - 20th for social/health insurance, payroll by 10th
    if (hasEmployees) {
      deadlines.push({
        id: `mzdy-sp-${monthStr}`,
        title: `Odvod SP a ZP za ${format(new Date(year, m - 1, 1), 'LLLL', { locale: cs })}`,
        date: format(new Date(year, m, 20), 'yyyy-MM-dd'),
        type: 'mzdy',
        description: 'Sociální + zdravotní pojištění zaměstnanců',
      })
    }

    // Měsíční uzávěrka podkladů - 15th (configurable deadline)
    deadlines.push({
      id: `uzav-${monthStr}`,
      title: `Podklady za ${format(new Date(year, m - 1, 1), 'LLLL', { locale: cs })}`,
      date: format(new Date(year, m, 15), 'yyyy-MM-dd'),
      type: 'uzaverka',
      description: 'Termín dodání podkladů pro měsíční zpracování',
    })
  }

  // Quarterly income tax advances (15th of month after quarter end)
  const quarterMonths = [3, 6, 9, 12] // March, June, September, December
  for (const qm of quarterMonths) {
    const advanceDate = new Date(year, qm, 15) // 15th of April, July, October, January
    if (differenceInDays(advanceDate, now) > -30 && differenceInDays(advanceDate, now) < 90) {
      deadlines.push({
        id: `dan-q-${qm}`,
        title: `Záloha daň z příjmů Q${qm / 3}`,
        date: format(advanceDate, 'yyyy-MM-dd'),
        type: 'dan',
        description: entityType === 'osvc'
          ? 'Čtvrtletní záloha DPFO (§38a ZDP)'
          : 'Čtvrtletní záloha DPPO (§38a ZDP)',
      })
    }
  }

  return deadlines
}

const typeIcons: Record<string, typeof Calendar> = {
  dph: Receipt,
  dan: Wallet,
  pojisteni: Building2,
  mzdy: Building2,
  uzaverka: FileText,
  ostatni: Calendar,
}

const typeColors: Record<string, string> = {
  dph: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200',
  dan: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200',
  pojisteni: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200',
  mzdy: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200',
  uzaverka: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  ostatni: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
}

const typeLabels: Record<string, string> = {
  dph: 'DPH',
  dan: 'Daně',
  pojisteni: 'Pojištění',
  mzdy: 'Mzdy',
  uzaverka: 'Uzávěrka',
  ostatni: 'Ostatní',
}

export function AccountantDeadlineCalendar({
  companyId,
  companyName,
  vatPeriod,
  hasEmployees = false,
  entityType,
}: AccountantDeadlineCalendarProps) {
  const deadlines = useMemo(() => {
    return generateStatutoryDeadlines(vatPeriod, hasEmployees, entityType)
      .filter(d => !d.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [vatPeriod, hasEmployees, entityType])

  const groupedDeadlines = useMemo(() => {
    const today = new Date()
    const overdue: Deadline[] = []
    const thisWeek: Deadline[] = []
    const thisMonth: Deadline[] = []
    const later: Deadline[] = []

    deadlines.forEach(deadline => {
      const date = new Date(deadline.date)
      const daysUntil = differenceInDays(date, today)

      if (isPast(date) && !isToday(date)) {
        overdue.push(deadline)
      } else if (daysUntil <= 7) {
        thisWeek.push(deadline)
      } else if (isWithinInterval(date, { start: startOfMonth(today), end: endOfMonth(today) })) {
        thisMonth.push(deadline)
      } else {
        later.push(deadline)
      }
    })

    return { overdue, thisWeek, thisMonth, later }
  }, [deadlines])

  const formatDeadlineDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Dnes'
    if (isTomorrow(date)) return 'Zítra'
    if (isPast(date)) {
      const days = differenceInDays(new Date(), date)
      return `${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'} po termínu`
    }
    const daysUntil = differenceInDays(date, new Date())
    if (daysUntil <= 7) {
      return format(date, 'EEEE', { locale: cs })
    }
    return format(date, 'd. MMMM', { locale: cs })
  }

  const getDateColor = (dateString: string) => {
    const date = new Date(dateString)
    if (isPast(date) && !isToday(date)) return 'text-red-600 dark:text-red-400'
    if (isToday(date)) return 'text-orange-600 dark:text-orange-400'
    if (isTomorrow(date)) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const renderDeadlineItem = (deadline: Deadline) => {
    const Icon = typeIcons[deadline.type]
    return (
      <div
        key={deadline.id}
        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors"
      >
        <div className={`p-2 rounded-lg ${typeColors[deadline.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">{deadline.title}</span>
            <Badge variant="outline" className={`text-xs ${typeColors[deadline.type]}`}>
              {typeLabels[deadline.type]}
            </Badge>
          </div>
          {deadline.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {deadline.description}
            </p>
          )}
        </div>
        <div className={`text-sm font-medium whitespace-nowrap ${getDateColor(deadline.date)}`}>
          {formatDeadlineDate(deadline.date)}
        </div>
      </div>
    )
  }

  const renderSection = (title: string, items: Deadline[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-1">
            {items.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map(renderDeadlineItem)}
        </div>
      </div>
    )
  }

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-300" />
        <p className="mb-2">Žádné nadcházející termíny</p>
        <p className="text-sm text-gray-400">
          {!vatPeriod && !hasEmployees
            ? 'Firma není plátce DPH a nemá zaměstnance'
            : 'Všechny termíny jsou splněny'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`p-3 rounded-lg border ${groupedDeadlines.overdue.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {groupedDeadlines.overdue.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Po termínu</div>
        </div>
        <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {groupedDeadlines.thisWeek.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Tento týden</div>
        </div>
        <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {groupedDeadlines.thisMonth.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Tento měsíc</div>
        </div>
        <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {groupedDeadlines.later.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Později</div>
        </div>
      </div>

      {/* Deadline lists */}
      <div className="space-y-6">
        {renderSection(
          'Po termínu',
          groupedDeadlines.overdue,
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
        {renderSection(
          'Tento týden',
          groupedDeadlines.thisWeek,
          <Clock className="h-4 w-4 text-orange-500" />
        )}
        {renderSection(
          'Tento měsíc',
          groupedDeadlines.thisMonth,
          <Calendar className="h-4 w-4 text-blue-500" />
        )}
        {renderSection(
          'Později',
          groupedDeadlines.later,
          <Calendar className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  )
}
