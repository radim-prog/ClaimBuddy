'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  FolderKanban,
  CheckSquare,
  Zap,
  Clock,
  User,
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
}

interface PrioritySectionProps {
  priority: 'high' | 'medium' | 'low'
  label: string
  emoji: string
  items: WorkItem[]
  defaultOpen?: boolean
  color: string
  borderColor: string
}

function PrioritySection({ priority, label, emoji, items, defaultOpen = true, color, borderColor }: PrioritySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${color} hover:opacity-90`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="secondary" className="text-xs ml-1">
            {items.length}
          </Badge>
        </div>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {open && items.length > 0 && (
        <div className={`mt-1 border-l-2 ${borderColor} ml-4 space-y-0.5`}>
          {items.map(item => (
            <WorkItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {open && items.length === 0 && (
        <div className="mt-2 ml-6 text-sm text-muted-foreground py-2">
          Zatím žádné položky
        </div>
      )}
    </div>
  )
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const href = item.type === 'project' || item.is_project
    ? `/accountant/projects/${item.id}`
    : `/accountant/tasks/${item.id}`

  const daysUntil = item.due_date ? getDaysUntil(item.due_date) : null
  const isOverdue = daysUntil !== null && daysUntil < 0
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg ml-2 transition-colors group"
    >
      {/* Type icon */}
      <div className="flex-shrink-0">
        {item.type === 'project' || item.is_project ? (
          <FolderKanban className="h-4 w-4 text-purple-500" />
        ) : (
          <CheckSquare className="h-4 w-4 text-blue-500" />
        )}
      </div>

      {/* Title + company */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {item.title}
          </span>
          {item.is_next_action && (
            <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        {item.company_name && (
          <span className="text-xs text-muted-foreground">{item.company_name}</span>
        )}
      </div>

      {/* Progress for projects */}
      {item.type === 'project' && item.progress_percentage !== undefined && item.progress_percentage > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${item.progress_percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8">{item.progress_percentage}%</span>
        </div>
      )}

      {/* Assigned to */}
      {item.assigned_to_name && (
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{item.assigned_to_name}</span>
        </div>
      )}

      {/* Deadline */}
      {item.due_date && (
        <div className={`flex items-center gap-1 flex-shrink-0 text-xs font-medium ${
          isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
        }`}>
          {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
          {formatDeadline(item.due_date)}
        </div>
      )}
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

function formatDeadline(dateString: string): string {
  const days = getDaysUntil(dateString)
  if (days < 0) return `${Math.abs(days)}d po`
  if (days === 0) return 'Dnes'
  if (days === 1) return 'Zítra'
  if (days <= 7) return `Za ${days}d`
  return new Date(dateString).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
}

// Priority grouping config
const PRIORITY_CONFIG = {
  high: {
    label: 'Vysoká priorita',
    emoji: '🔴',
    color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  medium: {
    label: 'Střední priorita',
    emoji: '🟡',
    color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  low: {
    label: 'Nízká priorita',
    emoji: '🟢',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    borderColor: 'border-green-300 dark:border-green-700',
  },
}

interface PrioritySwimlanesProps {
  items: WorkItem[]
}

export function PrioritySwimlanes({ items }: PrioritySwimlanesProps) {
  const high = items.filter(i => i.priority === 'high')
  const medium = items.filter(i => i.priority === 'medium')
  const low = items.filter(i => i.priority === 'low')

  return (
    <div>
      <PrioritySection
        priority="high"
        items={high}
        defaultOpen={true}
        {...PRIORITY_CONFIG.high}
      />
      <PrioritySection
        priority="medium"
        items={medium}
        defaultOpen={true}
        {...PRIORITY_CONFIG.medium}
      />
      <PrioritySection
        priority="low"
        items={low}
        defaultOpen={low.length <= 5}
        {...PRIORITY_CONFIG.low}
      />
    </div>
  )
}
