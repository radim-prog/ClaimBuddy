'use client'

import { AlertCircle, Bell, Calendar, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DeadlineItem {
  id: string
  title: string
  dueDate: string // ISO format
  type: 'critical' | 'urgent' | 'warning'
  caseId?: string
  companyId?: string
  companyName?: string
}

interface DeadlineAlertBarProps {
  deadlines: DeadlineItem[]
}

export function DeadlineAlertBar({ deadlines }: DeadlineAlertBarProps) {
  const [dismissed, setDismissed] = useState<string[]>([])

  const visibleDeadlines = deadlines.filter(d => !dismissed.includes(d.id))

  if (visibleDeadlines.length === 0) return null

  const getHoursUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = due.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  const formatTimeLeft = (dueDate: string) => {
    const hours = getHoursUntil(dueDate)

    if (hours < 0) {
      const days = Math.abs(Math.floor(hours / 24))
      return `Prošlo před ${days} dny`
    }
    if (hours === 0) return 'DNES!'
    if (hours < 24) return `Zbývá ${hours} hodin`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Zbývá 1 den'
    return `Zbývá ${days} dní`
  }

  const getBarStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700'
      case 'urgent':
        return 'bg-orange-500 text-white border-orange-600'
      case 'warning':
        return 'bg-yellow-400 text-gray-900 border-yellow-500'
      default:
        return 'bg-blue-500 text-white border-blue-600'
    }
  }

  const mostUrgent = visibleDeadlines[0]
  const overdue = getHoursUntil(mostUrgent.dueDate) < 0

  const linkUrl = mostUrgent.companyId ? `/accountant/clients/${mostUrgent.companyId}` : '#'

  return (
    <div className={`${getBarStyle(mostUrgent.type)} border-b-2 px-6 py-3 shadow-lg animate-pulse`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link href={linkUrl} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity">
          {overdue ? (
            <AlertCircle className="h-6 w-6 flex-shrink-0 animate-bounce" />
          ) : (
            <Bell className="h-6 w-6 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {overdue ? '🔴 PROŠLÝ TERMÍN:' : '⏰ URGENTNÍ:'}
              </span>
              <span className="font-semibold truncate">{mostUrgent.title}</span>
              {mostUrgent.companyName && (
                <span className="text-xs opacity-90">({mostUrgent.companyName})</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {new Date(mostUrgent.dueDate).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-white/20">
                {formatTimeLeft(mostUrgent.dueDate)}
              </Badge>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {visibleDeadlines.length > 1 && (
            <Badge
              variant="secondary"
              className="bg-white/20 text-xs cursor-pointer hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const widget = document.getElementById('deadline-widget')
                if (widget) {
                  widget.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }}
            >
              +{visibleDeadlines.length - 1} dalších
            </Badge>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-white/20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDismissed([...dismissed, mostUrgent.id])
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
