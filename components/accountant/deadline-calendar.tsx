'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Building2,
  Receipt,
  Wallet,
  Shield,
  Plus,
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast, addDays, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { cs } from 'date-fns/locale'

interface Deadline {
  id: string
  title: string
  date: string
  type: 'dph' | 'dan' | 'pojisteni' | 'mzdy' | 'uzaverka' | 'ostatni'
  companyId?: string
  companyName?: string
  description?: string
  completed?: boolean
}

interface AccountantDeadlineCalendarProps {
  companyId?: string
  companyName?: string
  showAllClients?: boolean
}

// Generate mock deadlines based on company
const generateDeadlines = (companyId?: string): Deadline[] => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const baseDeadlines: Deadline[] = [
    // DPH deadlines
    {
      id: 'dph-1',
      title: 'DPH přiznání',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-25`,
      type: 'dph',
      companyId: 'company-1',
      companyName: 'ABC s.r.o.',
      description: 'Měsíční DPH přiznání za předchozí měsíc',
    },
    {
      id: 'dph-2',
      title: 'DPH přiznání',
      date: `${currentYear}-${String((currentMonth + 2) % 12 || 12).padStart(2, '0')}-25`,
      type: 'dph',
      companyId: 'company-4',
      companyName: 'GHI Trading',
      description: 'Měsíční DPH přiznání',
    },
    // Salary deadlines
    {
      id: 'mzdy-1',
      title: 'Odvod mezd',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`,
      type: 'mzdy',
      companyId: 'company-1',
      companyName: 'ABC s.r.o.',
      description: 'Odvody sociální a zdravotní pojištění',
      completed: isPast(new Date(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`)),
    },
    {
      id: 'mzdy-2',
      title: 'Mzdy zaměstnanců',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      type: 'mzdy',
      companyId: 'company-3',
      companyName: 'DEF s.r.o.',
      description: 'Výplatní termín zaměstnanců',
      completed: true,
    },
    // Insurance
    {
      id: 'poj-1',
      title: 'Platba pojištění',
      date: format(addDays(now, 15), 'yyyy-MM-dd'),
      type: 'pojisteni',
      companyId: 'company-1',
      companyName: 'ABC s.r.o.',
      description: 'Roční pojištění odpovědnosti',
    },
    // Monthly closures
    {
      id: 'uzav-1',
      title: 'Měsíční uzávěrka',
      date: format(addDays(now, 5), 'yyyy-MM-dd'),
      type: 'uzaverka',
      companyId: 'company-1',
      companyName: 'ABC s.r.o.',
      description: 'Uzávěrka za předchozí měsíc',
    },
    {
      id: 'uzav-2',
      title: 'Měsíční uzávěrka',
      date: format(addDays(now, 7), 'yyyy-MM-dd'),
      type: 'uzaverka',
      companyId: 'company-4',
      companyName: 'GHI Trading',
      description: 'Uzávěrka za předchozí měsíc',
    },
    // Tax deadlines
    {
      id: 'dan-1',
      title: 'Záloha daň z příjmů',
      date: format(addDays(now, 30), 'yyyy-MM-dd'),
      type: 'dan',
      companyId: 'company-7',
      companyName: 'PQR Development',
      description: 'Čtvrtletní záloha na daň',
    },
    // Other
    {
      id: 'ost-1',
      title: 'STK vozidla',
      date: format(addDays(now, 45), 'yyyy-MM-dd'),
      type: 'ostatni',
      companyId: 'company-1',
      companyName: 'ABC s.r.o.',
      description: 'Technická kontrola služebního vozidla',
    },
  ]

  // Filter by company if specified
  if (companyId) {
    return baseDeadlines.filter(d => d.companyId === companyId)
  }

  return baseDeadlines
}

const typeIcons: Record<string, typeof Calendar> = {
  dph: Receipt,
  dan: Wallet,
  pojisteni: Shield,
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
  showAllClients = false,
}: AccountantDeadlineCalendarProps) {
  const deadlines = useMemo(() => {
    return generateDeadlines(companyId)
      .filter(d => !d.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [companyId])

  // Group deadlines by time period
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
        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700 transition-colors"
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
          {showAllClients && deadline.companyName && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              {deadline.companyName}
            </p>
          )}
          {deadline.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {deadline.description}
            </p>
          )}
        </div>
        <div className={`text-sm font-medium ${getDateColor(deadline.date)}`}>
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
          {companyId
            ? 'Pro tohoto klienta nejsou naplánované žádné termíny'
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

      {/* Add deadline button */}
      <div className="pt-4 border-t dark:border-gray-700">
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Přidat termín
        </Button>
      </div>
    </div>
  )
}
