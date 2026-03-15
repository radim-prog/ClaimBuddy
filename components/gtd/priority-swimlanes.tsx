'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  FolderKanban,
  CheckSquare,
  Zap,
  AlertTriangle,
} from 'lucide-react'

export type WorkItemType = 'task' | 'project'

export interface WorkItem {
  id: string
  title: string
  type: WorkItemType
  status: string
  priority: 'high' | 'medium' | 'low'
  total_score?: number
  due_date?: string
  company_name?: string
  assigned_to_name?: string
  is_next_action?: boolean
  progress_percentage?: number
  is_project?: boolean
  updated_at?: string
  status_label?: string
  source?: 'tasks' | 'projects'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Nový', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  clarifying: { label: 'Upřesnit', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  accepted: { label: 'Přijato', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  in_progress: { label: 'Probíhá', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  waiting_for: { label: 'Čeká se', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  waiting_client: { label: 'Čeká klient', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  awaiting_approval: { label: 'Ke schválení', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  delegated: { label: 'Delegováno', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  planning: { label: 'Plánování', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'Aktivní', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  on_hold: { label: 'Pozastaveno', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  review: { label: 'Review', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
}

const PRIORITY_CONFIG = {
  high: {
    label: 'Vysoká priorita',
    borderColor: 'border-l-red-500',
    dotColor: 'bg-red-500',
  },
  medium: {
    label: 'Střední priorita',
    borderColor: 'border-l-amber-500',
    dotColor: 'bg-amber-500',
  },
  low: {
    label: 'Nízká priorita',
    borderColor: 'border-l-emerald-500',
    dotColor: 'bg-emerald-500',
  },
}

interface PriorityGroupProps {
  label: string
  items: WorkItem[]
  defaultOpen?: boolean
  dotColor: string
  borderColor: string
}

function PriorityGroup({ label, items, defaultOpen = true, dotColor, borderColor }: PriorityGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (items.length === 0) return null

  return (
    <div>
      {/* Subtle group header — matches clients page group style */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-1 py-2 group"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {items.length}
        </span>
      </button>

      {open && (
        <div className="space-y-1.5">
          {items.map(item => (
            <WorkItemRow key={item.id} item={item} borderColor={borderColor} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkItemRow({ item, borderColor }: { item: WorkItem; borderColor: string }) {
  const href = item.source === 'projects'
    ? `/accountant/projects/${item.id}`
    : `/accountant/tasks/${item.id}`

  const daysUntil = item.due_date ? getDaysUntil(item.due_date) : null
  const isOverdue = daysUntil !== null && daysUntil < 0
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3

  const lastActionDays = item.updated_at ? getDaysAgo(item.updated_at) : null
  const isStale = lastActionDays !== null && lastActionDays > 7

  const statusInfo = STATUS_LABELS[item.status] || { label: item.status_label || item.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <Link href={href}>
      <Card className={`card-hover transition-all duration-200 cursor-pointer border-l-4 rounded-xl ${borderColor}`}>
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center">
            {/* Title + company */}
            <div className="col-span-1 sm:col-span-4 min-w-0">
              <div className="flex items-center gap-2">
                {item.type === 'project' || item.is_project ? (
                  <FolderKanban className="h-4 w-4 text-violet-500 shrink-0" />
                ) : (
                  <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />
                )}
                <span className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                  {item.title}
                </span>
                {item.is_next_action && (
                  <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              {item.company_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-6 truncate">
                  {item.company_name}
                </div>
              )}
            </div>

            {/* Status + type badges */}
            <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              {(item.type === 'project' || item.is_project) && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-700">
                  Projekt
                </Badge>
              )}
            </div>

            {/* Deadline + activity */}
            <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
              {item.due_date ? (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>{formatDeadlineDays(daysUntil!)}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
              )}
              {lastActionDays !== null && (
                <span className={`text-[11px] ${
                  isStale ? 'text-amber-500 dark:text-amber-400 font-medium' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {formatDaysAgo(lastActionDays)}
                </span>
              )}
            </div>

            {/* Assigned to */}
            <div className="hidden sm:flex col-span-2 items-center justify-end gap-1.5">
              {item.assigned_to_name ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      {item.assigned_to_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[70px]">
                    {item.assigned_to_name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function getDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateString)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysAgo(dateString: string): number {
  const now = new Date()
  const d = new Date(dateString)
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDeadlineDays(days: number): string {
  if (days < -1) return `${Math.abs(days)}d po termínu`
  if (days === -1) return '1d po termínu'
  if (days === 0) return 'Dnes'
  if (days === 1) return 'Zítra'
  return `za ${days}d`
}

function formatDaysAgo(days: number): string {
  if (days === 0) return 'dnes'
  if (days === 1) return 'včera'
  if (days <= 7) return `${days}d`
  if (days <= 30) return `${Math.floor(days / 7)}t`
  return `${Math.floor(days / 30)}m`
}

interface PrioritySwimlanesProps {
  items: WorkItem[]
}

export function PrioritySwimlanes({ items }: PrioritySwimlanesProps) {
  const high = items.filter(i => i.priority === 'high')
  const medium = items.filter(i => i.priority === 'medium')
  const low = items.filter(i => i.priority === 'low')

  return (
    <div className="space-y-4">
      <PriorityGroup
        items={high}
        defaultOpen={true}
        {...PRIORITY_CONFIG.high}
      />
      <PriorityGroup
        items={medium}
        defaultOpen={true}
        {...PRIORITY_CONFIG.medium}
      />
      <PriorityGroup
        items={low}
        defaultOpen={low.length <= 5}
        {...PRIORITY_CONFIG.low}
      />
    </div>
  )
}
