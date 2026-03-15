'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronDown, Building2, ListTodo, MessageSquare } from 'lucide-react'
import {
  type ConversationWithContext,
  KomunikaceConversationRow,
  groupByClient,
  formatTime,
  getWaitingDuration,
  SLA_COLORS,
  SLA_DOT,
} from './komunikace-conversation-row'

const CATEGORY_CONFIG = {
  needs_response: {
    label: 'Ceka na nas',
    dotColor: 'bg-red-500',
    borderColor: 'border-l-red-500',
    headerBg: 'bg-red-50 dark:bg-red-900/10',
    countBg: 'bg-red-500 text-white',
    emptyText: 'Vse zodpovezeno',
  },
  awaiting_client: {
    label: 'Ceka na klienta',
    dotColor: 'bg-amber-500',
    borderColor: 'border-l-amber-500',
    headerBg: 'bg-amber-50 dark:bg-amber-900/10',
    countBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    emptyText: 'Zadne konverzace',
  },
  completed: {
    label: 'Vyreseno',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-l-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/10',
    countBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    emptyText: 'Zadne vyresene',
  },
} as const

interface SwimlaineTileProps {
  category: 'needs_response' | 'awaiting_client' | 'completed'
  conversations: ConversationWithContext[]
  maxItems?: number
  onConversationClick: (id: string) => void
  onShowAll: () => void
}

export function KomunikaceSwimlaineTile({ category, conversations, maxItems = 5, onConversationClick, onShowAll }: SwimlaineTileProps) {
  const config = CATEGORY_CONFIG[category]
  const groups = useMemo(() => groupByClient(conversations), [conversations])
  const displayed = groups.slice(0, maxItems)
  const remaining = groups.length - displayed.length
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <Card className={`rounded-xl shadow-soft border-0 overflow-hidden border-l-4 ${config.borderColor}`}>
      {/* Header */}
      <button
        onClick={onShowAll}
        className={`w-full px-4 py-3 ${config.headerBg} flex items-center justify-between hover:brightness-95 transition-all cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} ${category === 'needs_response' && conversations.length > 0 ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {config.label}
          </span>
          <Badge className={`text-xs font-bold px-2 py-0.5 ${config.countBg} border-0`}>
            {conversations.length}
          </Badge>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>

      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground">{config.emptyText}</p>
          </div>
        ) : (
          <>
            {displayed.map((group) => {
              const hasMultiple = group.conversations.length > 1
              const slaInfo = group.oldestWaiting ? getWaitingDuration(group.oldestWaiting.toISOString()) : null

              // Single conversation — render as normal row
              if (!hasMultiple) {
                return (
                  <KomunikaceConversationRow
                    key={group.clientId}
                    conversation={group.conversations[0]}
                    showSla={category === 'needs_response'}
                    onClick={onConversationClick}
                  />
                )
              }

              // Multiple conversations — collapsed row, expandable on click
              const newest = group.conversations[0]
              const newestTime = newest.last_message_at || newest.created_at
              const isExpanded = expandedGroups.has(group.clientId)

              return (
                <div key={group.clientId}>
                  <button
                    onClick={() => toggleGroup(group.clientId)}
                    className="w-full text-left px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                      <div className={`p-1 rounded flex-shrink-0 ${group.isTask ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                        {group.isTask ? (
                          <ListTodo className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Building2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <span className={`shrink-0 text-sm ${group.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
                        {group.clientName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold shrink-0">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {group.conversations.length}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
                        {slaInfo && category === 'needs_response' && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SLA_COLORS[slaInfo.level]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${SLA_DOT[slaInfo.level]}`} />
                            {slaInfo.text}
                          </span>
                        )}
                        {group.unreadCount > 0 && (
                          <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-red-500 hover:bg-red-500">{group.unreadCount}</Badge>
                        )}
                        <span className="text-[11px] text-gray-400 w-10 text-right">{formatTime(newestTime)}</span>
                      </div>
                    </div>
                    {!isExpanded && newest.last_message_preview && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 pl-6">
                        {newest.subject}: {newest.last_message_preview}
                      </p>
                    )}
                  </button>

                  {/* Expanded conversations */}
                  {isExpanded && group.conversations.map(conv => (
                    <div key={conv.id} className="pl-6 bg-gray-50/50 dark:bg-gray-800/10">
                      <KomunikaceConversationRow
                        conversation={conv}
                        showSla={category === 'needs_response'}
                        onClick={onConversationClick}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
            {remaining > 0 && (
              <button
                onClick={onShowAll}
                className="w-full px-4 py-2.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors flex items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-800"
              >
                Zobrazit vse ({conversations.length})
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
