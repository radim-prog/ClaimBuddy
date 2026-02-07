'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  CreditCard,
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Deadline {
  id: string
  company_id: string
  title: string
  description?: string
  date: string
  type: 'vat' | 'tax' | 'insurance' | 'document' | 'other'
  priority: 'high' | 'medium' | 'low'
  completed?: boolean
}

interface DeadlineCalendarProps {
  companyId?: string
  companyName?: string
}

// Mock deadlines
const mockDeadlines: Deadline[] = [
  {
    id: 'dl-1',
    company_id: 'company-11',
    title: 'Podání přiznání k DPH',
    description: 'Přiznání za 4. čtvrtletí 2025',
    date: '2026-01-25',
    type: 'vat',
    priority: 'high',
  },
  {
    id: 'dl-2',
    company_id: 'company-11',
    title: 'Kontrolní hlášení',
    description: 'KH za prosinec 2025',
    date: '2026-01-25',
    type: 'vat',
    priority: 'high',
  },
  {
    id: 'dl-3',
    company_id: 'company-11',
    title: 'Silniční daň',
    description: 'Záloha za 4. čtvrtletí',
    date: '2026-01-15',
    type: 'tax',
    priority: 'medium',
  },
  {
    id: 'dl-4',
    company_id: 'company-11',
    title: 'Výročí pojištění',
    description: 'Kybernetické pojištění - obnovení',
    date: '2025-11-28',
    type: 'insurance',
    priority: 'high',
    completed: true,
  },
  {
    id: 'dl-5',
    company_id: 'company-11',
    title: 'Výpis z banky',
    description: 'Nahrát výpis za prosinec',
    date: '2026-01-05',
    type: 'document',
    priority: 'medium',
  },
  {
    id: 'dl-6',
    company_id: 'company-11',
    title: 'Roční účetní závěrka',
    description: 'Příprava podkladů pro závěrku 2025',
    date: '2026-03-31',
    type: 'tax',
    priority: 'high',
  },
  {
    id: 'dl-7',
    company_id: 'company-11',
    title: 'Přiznání k dani z příjmů',
    description: 'DPPO za rok 2025',
    date: '2026-04-01',
    type: 'tax',
    priority: 'high',
  },
  {
    id: 'dl-8',
    company_id: 'company-11',
    title: 'Pojištění VW Passat',
    description: 'Výročí pojištění vozidla',
    date: '2026-01-20',
    type: 'insurance',
    priority: 'medium',
  },
]

const typeIcons: Record<string, React.ReactNode> = {
  vat: <Receipt className="h-4 w-4" />,
  tax: <Building2 className="h-4 w-4" />,
  insurance: <CreditCard className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  other: <Clock className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  vat: 'DPH',
  tax: 'Daně',
  insurance: 'Pojištění',
  document: 'Dokumenty',
  other: 'Ostatní',
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700',
}

export function DeadlineCalendar({ companyId, companyName }: DeadlineCalendarProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // Filter deadlines for company
    let filtered = mockDeadlines
    if (companyId) {
      filtered = filtered.filter(d => d.company_id === companyId)
    }
    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setDeadlines(filtered)
  }, [companyId])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0)
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyClass = (days: number, completed?: boolean) => {
    if (completed) return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
    if (days < 0) return 'bg-red-50 border-red-300'
    if (days <= 7) return 'bg-amber-50 border-amber-300'
    if (days <= 30) return 'bg-blue-50 border-blue-200'
    return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDaysUntil = (days: number) => {
    if (days < 0) return `${Math.abs(days)} dní po termínu`
    if (days === 0) return 'Dnes!'
    if (days === 1) return 'Zítra'
    if (days <= 7) return `Za ${days} dní`
    if (days <= 30) return `Za ${days} dní`
    return `Za ${days} dní`
  }

  // Filter upcoming deadlines (not completed, in future or overdue)
  const upcomingDeadlines = deadlines.filter(d => !d.completed)
  const overdueCount = upcomingDeadlines.filter(d => getDaysUntil(d.date) < 0).length
  const urgentCount = upcomingDeadlines.filter(d => {
    const days = getDaysUntil(d.date)
    return days >= 0 && days <= 7
  }).length

  const displayDeadlines = showAll ? upcomingDeadlines : upcomingDeadlines.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Kalendář termínů
              {overdueCount > 0 && (
                <Badge variant="destructive">{overdueCount} po termínu</Badge>
              )}
              {urgentCount > 0 && overdueCount === 0 && (
                <Badge className="bg-amber-500">{urgentCount} brzy</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Důležité termíny a deadlines {companyName ? `pro ${companyName}` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingDeadlines.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Žádné nadcházející termíny</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayDeadlines.map((deadline) => {
              const daysUntil = getDaysUntil(deadline.date)

              return (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-lg border-2 transition-all ${getUrgencyClass(daysUntil, deadline.completed)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        deadline.completed
                          ? 'bg-gray-200'
                          : daysUntil < 0
                            ? 'bg-red-200'
                            : daysUntil <= 7
                              ? 'bg-amber-200'
                              : 'bg-blue-100'
                      }`}>
                        {typeIcons[deadline.type]}
                      </div>
                      <div>
                        <h4 className={`font-medium ${deadline.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                          {deadline.title}
                        </h4>
                        {deadline.description && (
                          <p className="text-sm text-muted-foreground">{deadline.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[deadline.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(deadline.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {!deadline.completed && (
                        <div className={`text-sm font-medium ${
                          daysUntil < 0
                            ? 'text-red-700'
                            : daysUntil <= 7
                              ? 'text-amber-700'
                              : 'text-blue-700'
                        }`}>
                          {daysUntil < 0 && <AlertTriangle className="h-4 w-4 inline mr-1" />}
                          {formatDaysUntil(daysUntil)}
                        </div>
                      )}
                      {deadline.completed && (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          Hotovo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {upcomingDeadlines.length > 5 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Zobrazit méně' : `Zobrazit všech ${upcomingDeadlines.length} termínů`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
