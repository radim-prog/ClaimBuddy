'use client'

import { useState } from 'react'
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DeadlineTask {
  id: string
  title: string
  dueDate: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'overdue' | 'today' | 'this-week' | 'later'
  companyId?: string
  companyName?: string
  assignedTo?: string
}

interface DeadlineDashboardWidgetProps {
  tasks: DeadlineTask[]
}

export function DeadlineDashboardWidget({ tasks }: DeadlineDashboardWidgetProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const getDaysUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = due.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'today':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'this-week':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDeadline = (dueDate: string) => {
    const days = getDaysUntil(dueDate)
    const date = new Date(dueDate)

    if (days < 0) return `PROŠLO před ${Math.abs(days)} dny`
    if (days === 0) return 'DNES'
    if (days === 1) return 'ZÍTRA (zbývá 1 den)'
    if (days <= 7) return `Zbývá ${days} dní`
    if (days <= 14) return `Zbývá ${days} dní`

    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
  }

  // Group tasks by status
  const overdueTasks = tasks.filter(t => t.status === 'overdue')
  const todayTasks = tasks.filter(t => t.status === 'today')
  const thisWeekTasks = tasks.filter(t => t.status === 'this-week')
  const laterTasks = tasks.filter(t => t.status === 'later')

  const sections = [
    { title: '🔴 PROŠLÉ TERMÍNY', tasks: overdueTasks, show: overdueTasks.length > 0 },
    { title: '🟠 DNES', tasks: todayTasks, show: todayTasks.length > 0 },
    { title: '🟡 TENTO TÝDEN', tasks: thisWeekTasks, show: thisWeekTasks.length > 0 },
    { title: '🔵 POZDĚJI', tasks: laterTasks, show: laterTasks.length > 0 && laterTasks.length <= 3 }
  ]

  const totalUrgent = overdueTasks.length + todayTasks.length

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Deadlines & Termíny
          </CardTitle>
          {totalUrgent > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {totalUrgent} urgentní
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Žádné nadcházející deadlines</p>
          </div>
        ) : (
          <>
            {sections.map((section, idx) =>
              section.show ? (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase">
                    {section.title} ({section.tasks.length})
                  </h4>
                  <div className="space-y-2">
                    {section.tasks.slice(0, expandedSections.has(idx) ? undefined : 3).map((task) => {
                      const linkUrl = task.companyId ? `/accountant/clients/${task.companyId}` : '#'

                      return (
                        <Link key={task.id} href={linkUrl}>
                          <div
                            className={`p-3 rounded-lg border ${getStatusColor(task.status)} cursor-pointer hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getPriorityIcon(task.priority)}
                                  <span className="text-sm font-medium truncate">{task.title}</span>
                                </div>
                                {task.companyName && (
                                  <p className="text-xs opacity-75 truncate">{task.companyName}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-bold">
                                  {formatDeadline(task.dueDate)}
                                </div>
                                <div className="text-xs opacity-75">
                                  {new Date(task.dueDate).toLocaleTimeString('cs-CZ', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    {section.tasks.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => toggleSection(idx)}
                      >
                        {expandedSections.has(idx)
                          ? '↑ Zobrazit méně'
                          : `Zobrazit všech ${section.tasks.length} →`
                        }
                      </Button>
                    )}
                  </div>
                </div>
              ) : null
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
