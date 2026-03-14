'use client'

import { Badge } from '@/components/ui/badge'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'

// ─── Shared Types ───

export interface ConversationWithContext {
  id: string
  company_id: string | null
  task_id?: string | null
  type?: string
  subject: string
  status: 'open' | 'completed'
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  company_name?: string | null
  task_title?: string | null
  source_type: 'company' | 'task'
  source_url: string
  created_at: string
  waiting_since: string | null
  last_responder: string | null
}

export interface ClientGroup {
  clientId: string
  clientName: string
  conversations: ConversationWithContext[]
  oldestWaiting: Date | null
  waitingCount: number
  unreadCount: number
  isTask: boolean
}

export type ViewMode = 'needs_response' | 'awaiting_client' | 'completed'

// ─── Shared Helpers ───

export function formatTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
  if (isYesterday(date)) return 'Vcera'
  return format(date, 'd.M.', { locale: cs })
}

export function formatMessageTime(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
  if (isYesterday(date)) return `Vcera ${format(date, 'HH:mm', { locale: cs })}`
  return format(date, 'd.M. HH:mm', { locale: cs })
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getWaitingDuration(waitingSince: string | null): { text: string; level: 'ok' | 'warning' | 'danger' } {
  if (!waitingSince) return { text: '', level: 'ok' }
  const now = Date.now()
  const waiting = new Date(waitingSince).getTime()
  const hours = (now - waiting) / (1000 * 60 * 60)

  if (hours < 1) {
    const mins = Math.floor((now - waiting) / (1000 * 60))
    return { text: `${mins}m`, level: 'ok' }
  }
  if (hours < 24) return { text: `${Math.floor(hours)}h`, level: 'ok' }
  if (hours < 48) return { text: '1d', level: 'warning' }
  const days = Math.floor(hours / 24)
  return { text: `${days}d`, level: days >= 3 ? 'danger' : 'warning' }
}

export const SLA_COLORS = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const

export const SLA_DOT = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500 animate-pulse',
} as const

export function groupByClient(convs: ConversationWithContext[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>()

  for (const c of convs) {
    const key = c.source_type === 'task'
      ? `task-${c.task_id}`
      : `company-${c.company_id}`
    const name = c.source_type === 'task'
      ? (c.task_title || 'Ukol')
      : (c.company_name || 'Neznamy klient')

    if (!map.has(key)) {
      map.set(key, {
        clientId: key,
        clientName: name,
        conversations: [],
        oldestWaiting: null,
        waitingCount: 0,
        unreadCount: 0,
        isTask: c.source_type === 'task',
      })
    }
    const group = map.get(key)!
    group.conversations.push(c)
    group.unreadCount += c.unread_count
    if (c.waiting_since) {
      group.waitingCount++
      const ws = new Date(c.waiting_since)
      if (!group.oldestWaiting || ws < group.oldestWaiting) {
        group.oldestWaiting = ws
      }
    }
  }

  const groups = Array.from(map.values())
  groups.sort((a, b) => {
    if (a.oldestWaiting && b.oldestWaiting) return a.oldestWaiting.getTime() - b.oldestWaiting.getTime()
    if (a.oldestWaiting) return -1
    if (b.oldestWaiting) return 1
    return a.clientName.localeCompare(b.clientName, 'cs')
  })

  return groups
}

// ─── Conversation Row Component ───

interface ConversationRowProps {
  conversation: ConversationWithContext
  isSelected?: boolean
  showSla?: boolean
  compact?: boolean
  onClick: (id: string) => void
}

export function KomunikaceConversationRow({ conversation: conv, isSelected, showSla, compact, onClick }: ConversationRowProps) {
  const hasUnread = conv.unread_count > 0
  const sla = conv.waiting_since ? getWaitingDuration(conv.waiting_since) : null

  return (
    <button
      onClick={() => onClick(conv.id)}
      className={`w-full text-left px-3 ${compact ? 'py-2' : 'py-2.5'} border-b border-gray-50 dark:border-gray-800/50 transition-all ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-600 dark:border-l-purple-400'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!compact && conv.company_name && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
              {conv.company_name}
            </span>
          )}
          <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
            {conv.subject}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showSla && sla && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SLA_DOT[sla.level]}`} />
          )}
          {hasUnread && (
            <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-red-500 hover:bg-red-500">{conv.unread_count}</Badge>
          )}
          <span className="text-[10px] text-gray-400">{formatTime(conv.last_message_at || conv.created_at)}</span>
        </div>
      </div>
      {conv.last_message_preview && !compact && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{conv.last_message_preview}</p>
      )}
    </button>
  )
}
