'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  MessageCircle,
  ListTodo,
  Building2,
  Loader2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'

interface ConversationWithContext {
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
}

function formatTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
  if (isYesterday(date)) return 'Vcera'
  return format(date, 'd.M.yyyy', { locale: cs })
}

export default function KomunikacePage() {
  const router = useRouter()
  const { userId } = useAccountantUser()
  const [conversations, setConversations] = useState<ConversationWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/accountant/conversations?limit=200', {
        headers: { 'x-user-id': userId },
      })
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const unread = conversations.filter(c => c.unread_count > 0 && c.status === 'open')
  const open = conversations.filter(c => c.status === 'open' && c.unread_count === 0)
  const completed = conversations.filter(c => c.status === 'completed')
  const totalUnread = unread.reduce((sum, c) => sum + c.unread_count, 0)

  const renderConversation = (conv: ConversationWithContext) => {
    const isTask = conv.source_type === 'task'
    return (
      <button
        key={conv.id}
        onClick={() => router.push(conv.source_url)}
        className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-lg ${isTask ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
            {isTask ? (
              <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {conv.subject}
              </span>
              {conv.unread_count > 0 && (
                <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-red-500 hover:bg-red-500">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">
                {isTask ? conv.task_title : conv.company_name}
              </span>
              <span className="text-[10px] text-gray-300 dark:text-gray-600">|</span>
              <span className="text-[10px] text-muted-foreground">
                {isTask ? 'Ukol' : 'Klient'}
              </span>
            </div>
            {conv.last_message_preview && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {conv.last_message_preview}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(conv.last_message_at || conv.created_at)}
            </span>
          </div>
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Komunikace</h1>
          {totalUnread > 0 && (
            <Badge className="bg-red-500 hover:bg-red-500 text-white">
              {totalUnread} neprectenych
            </Badge>
          )}
        </div>
      </div>

      {/* Unread section */}
      {unread.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 px-1">
            Neprectene ({unread.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
            {unread.map(renderConversation)}
          </div>
        </div>
      )}

      {/* Open section */}
      {open.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Otevrene ({open.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
            {open.map(renderConversation)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {unread.length === 0 && open.length === 0 && completed.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Zatim zadne konverzace</p>
        </div>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Dokoncene ({completed.length})
          </button>
          {showCompleted && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden opacity-60">
              {completed.map(renderConversation)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
