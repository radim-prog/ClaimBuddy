'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import {
  type ConversationWithContext,
  KomunikaceConversationRow,
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
  const displayed = conversations.slice(0, maxItems)
  const remaining = conversations.length - displayed.length

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
            {displayed.map(conv => (
              <KomunikaceConversationRow
                key={conv.id}
                conversation={conv}
                showSla={category === 'needs_response'}
                onClick={onConversationClick}
              />
            ))}
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
