'use client'

import { type ConversationWithContext } from './komunikace-conversation-row'
import { KomunikaceSwimlaineTile } from './komunikace-swimlane-tile'

interface SwimlanesProps {
  needsResponse: ConversationWithContext[]
  awaitingClient: ConversationWithContext[]
  completed: ConversationWithContext[]
  onConversationClick: (id: string) => void
  onShowAll: (view: string) => void
}

export function KomunikaceSwimlanes({ needsResponse, awaitingClient, completed, onConversationClick, onShowAll }: SwimlanesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KomunikaceSwimlaineTile
        category="needs_response"
        conversations={needsResponse}
        onConversationClick={onConversationClick}
        onShowAll={() => onShowAll('needs_response')}
      />
      <KomunikaceSwimlaineTile
        category="awaiting_client"
        conversations={awaitingClient}
        onConversationClick={onConversationClick}
        onShowAll={() => onShowAll('awaiting_client')}
      />
      <KomunikaceSwimlaineTile
        category="completed"
        conversations={completed}
        onConversationClick={onConversationClick}
        onShowAll={() => onShowAll('completed')}
      />
    </div>
  )
}
