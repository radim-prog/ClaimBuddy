'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity,
  Building2,
  Mail,
  FileCheck,
  CalendarCheck,
  ListTodo,
  Receipt,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ActivityType =
  | 'reminder_sent'
  | 'closure_status_changed'
  | 'deadline_completed'
  | 'task_generated'
  | 'vat_status_changed'

type ActivityItem = {
  id: string
  type: ActivityType
  company_id: string
  company_name: string
  title: string
  description: string
  created_at: string
  created_by: string
}

function getActivityTypeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    reminder_sent: 'Upomínka',
    closure_status_changed: 'Stav uzávěrky',
    deadline_completed: 'Termín splněn',
    task_generated: 'Úkoly vygenerovány',
    vat_status_changed: 'Stav DPH',
  }
  return labels[type]
}

function getActivityTypeColor(type: ActivityType): { bg: string; text: string } {
  const colors: Record<ActivityType, { bg: string; text: string }> = {
    reminder_sent: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
    closure_status_changed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    deadline_completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    task_generated: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
    vat_status_changed: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  }
  return colors[type]
}

const activityIcons: Record<ActivityType, typeof Activity> = {
  reminder_sent: Mail,
  closure_status_changed: FileCheck,
  deadline_completed: CalendarCheck,
  task_generated: ListTodo,
  vat_status_changed: Receipt,
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Právě teď'
  if (diffMin < 60) return `Před ${diffMin} min`
  if (diffH < 24) return `Před ${diffH} hod`
  if (diffD === 1) return 'Včera'
  if (diffD < 7) return `Před ${diffD} dny`
  return date.toLocaleDateString('cs-CZ')
}

type ActivityFeedProps = {
  companyId?: string // If provided, filter by company
  limit?: number
}

export function ActivityFeed({ companyId, limit = 15 }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Refresh periodically via API
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(`/api/accountant/activities?limit=${limit}`)
        if (!res.ok) return
        const data = await res.json()
        const all: ActivityItem[] = data.activities || []
        setItems(companyId ? all.filter(a => a.company_id === companyId) : all)
      } catch {}
    }
    refresh()
    const interval = setInterval(refresh, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [companyId, limit, refreshKey])

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p className="text-sm">Zatím žádná aktivita</p>
        <p className="text-xs mt-1">Aktivity se zde zobrazí po provedení akcí v aplikaci</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map(item => {
        const Icon = activityIcons[item.type] || Activity
        const typeColor = getActivityTypeColor(item.type)

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className={`p-1.5 rounded-md ${typeColor.bg} flex-shrink-0 mt-0.5`}>
              <Icon className={`h-3.5 w-3.5 ${typeColor.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/accountant/clients/${item.company_id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0"
                >
                  <Building2 className="h-3 w-3" />
                  {item.company_name}
                </Link>
                <Badge variant="outline" className={`text-[10px] px-1 py-0 ${typeColor.text}`}>
                  {getActivityTypeLabel(item.type)}
                </Badge>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">{item.title}</p>
              {item.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {timeAgo(item.created_at)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
