'use client'

import { ChatPanel } from '@/components/chat/chat-panel'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

interface AccountantMessagesSectionProps {
  companyId: string
  companyName: string
  clientName?: string
}

export function AccountantMessagesSection({ companyId, companyName, clientName }: AccountantMessagesSectionProps) {
  const { userName, userId } = useAccountantUser()

  return (
    <ChatPanel
      apiBase={`/api/accountant/companies/${companyId}/messages`}
      userId={userId || ''}
      senderName={userName || 'Ucetni'}
      senderType="accountant"
      accentColor="purple"
      height="500px"
      contextId={companyId}
      contextType="company"
      placeholder="Napiste zpravu klientovi..."
    />
  )
}
