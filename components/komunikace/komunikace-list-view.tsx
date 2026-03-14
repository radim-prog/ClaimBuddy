'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  ChevronLeft,
  ChevronDown,
  Building2,
  ListTodo,
  MessageSquare,
} from 'lucide-react'
import {
  type ConversationWithContext,
  type ViewMode,
  KomunikaceConversationRow,
  groupByClient,
  getWaitingDuration,
  SLA_COLORS,
  SLA_DOT,
} from './komunikace-conversation-row'

const VIEW_LABELS: Record<ViewMode, string> = {
  needs_response: 'Ceka na nas',
  awaiting_client: 'Ceka na klienta',
  completed: 'Vyreseno',
}

interface ListViewProps {
  conversations: ConversationWithContext[]
  viewMode: ViewMode
  onBack: () => void
  onConversationClick: (id: string) => void
}

export function KomunikaceListView({ conversations, viewMode, onBack, onConversationClick }: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!searchQuery) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c =>
      c.subject.toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.task_title || '').toLowerCase().includes(q) ||
      (c.last_message_preview || '').toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  const groups = useMemo(() => groupByClient(filtered), [filtered])

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header with breadcrumb and search */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-400">Komunikace</span>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{VIEW_LABELS[viewMode]}</span>
            <Badge variant="secondary" className="text-xs">{conversations.length}</Badge>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat konverzace..."
              className="h-8 pl-8 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Grouped conversation list */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Nic nenalezeno' : 'Zadne konverzace'}
            </p>
          </div>
        ) : (
          groups.map(group => {
            const isCollapsed = collapsedGroups.has(group.clientId)
            const slaInfo = group.oldestWaiting ? getWaitingDuration(group.oldestWaiting.toISOString()) : null
            const showSingle = group.conversations.length === 1

            return (
              <div key={group.clientId}>
                {/* Client group header */}
                <button
                  onClick={() => !showSingle && toggleGroup(group.clientId)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 ${
                    showSingle ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                  } ${slaInfo?.level === 'danger' ? 'bg-red-50/50 dark:bg-red-900/10' : slaInfo?.level === 'warning' ? 'bg-amber-50/30 dark:bg-amber-900/5' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                >
                  {!showSingle && (
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  )}
                  <div className={`p-1 rounded ${group.isTask ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    {group.isTask ? (
                      <ListTodo className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Building2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate flex-1">
                    {group.clientName}
                  </span>
                  {slaInfo && viewMode === 'needs_response' && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SLA_COLORS[slaInfo.level]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${SLA_DOT[slaInfo.level]}`} />
                      {slaInfo.text}
                    </span>
                  )}
                  {group.unreadCount > 0 && (
                    <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-red-500 hover:bg-red-500">{group.unreadCount}</Badge>
                  )}
                  {group.conversations.length > 1 && (
                    <span className="text-[10px] text-gray-400">{group.conversations.length}</span>
                  )}
                </button>

                {/* Conversations in group */}
                {(!isCollapsed || showSingle) && group.conversations.map(conv => (
                  <div key={conv.id} className={showSingle ? '' : 'pl-5'}>
                    <KomunikaceConversationRow
                      conversation={conv}
                      showSla={viewMode === 'needs_response'}
                      onClick={onConversationClick}
                    />
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
