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
  Activity,
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
}

// Status display config
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Nový', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  clarifying: { label: 'Upřesnit', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  accepted: { label: 'Přijato', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  in_progress: { label: 'Probíhá', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  waiting_for: { label: 'Čeká se', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  waiting_client: { label: 'Čeká klient', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  awaiting_approval: { label: 'Ke schválení', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  delegated: { label: 'Delegováno', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  // Projects
  planning: { label: 'Plánování', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'Aktivní', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  on_hold: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  review: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
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

function PrioritySection({ label, emoji, items, defaultOpen = true, color, borderColor }: PrioritySectionProps) {
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
        <div className={`mt-1 border-l-2 ${borderColor} ml-4`}>
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-1.5 ml-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Název</div>
            <div className="col-span-2">Stav</div>
            <div className="col-span-2 text-center">Termín</div>
            <div className="col-span-2 text-center">Poslední akce</div>
            <div className="col-span-2 text-right">Přiřazeno</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map(item => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
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

  const lastActionDays = item.updated_at ? getDaysAgo(item.updated_at) : null
  const isStale = lastActionDays !== null && lastActionDays > 7

  const statusInfo = STATUS_LABELS[item.status] || { label: item.status_label || item.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <Link
      href={href}
      className="flex sm:grid sm:grid-cols-12 items-center gap-2 sm:gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg ml-2 transition-colors group"
    >
      {/* Title + company (col-span-4) */}
      <div className="flex-1 sm:col-span-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            {item.type === 'project' || item.is_project ? (
              <FolderKanban className="h-4 w-4 text-purple-500" />
            ) : (
              <CheckSquare className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <span className="font-medium text-sm truncate text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {item.title}
          </span>
          {item.is_next_action && (
            <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        {item.company_name && (
          <span className="text-xs text-muted-foreground ml-6">{item.company_name}</span>
        )}
      </div>

      {/* Status (col-span-2) */}
      <div className="hidden sm:block sm:col-span-2">
        <Badge className={`text-[11px] font-medium px-2 py-0.5 ${statusInfo.color} border-0`}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Deadline - days (col-span-2) */}
      <div className="sm:col-span-2 flex-shrink-0">
        {item.due_date ? (
          <div className={`flex items-center justify-center gap-1 text-xs font-medium ${
            isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
          }`}>
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>{formatDeadlineDays(daysUntil!)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 flex justify-center">—</span>
        )}
      </div>

      {/* Last Action - days ago (col-span-2) */}
      <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
        {lastActionDays !== null ? (
          <div className={`flex items-center gap-1 text-xs ${
            isStale ? 'text-orange-500 dark:text-orange-400 font-medium' : 'text-muted-foreground'
          }`}>
            <Activity className="h-3 w-3" />
            <span>{formatDaysAgo(lastActionDays)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Assigned to (col-span-2) */}
      <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1 flex-shrink-0">
        {item.assigned_to_name ? (
          <>
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.assigned_to_name}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>
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
  if (days <= 7) return `před ${days}d`
  if (days <= 30) return `před ${Math.floor(days / 7)}t`
  return `před ${Math.floor(days / 30)}m`
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
