'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { KomunikaceChatDetail } from './komunikace-chat-detail'
import { type ConversationWithContext } from './komunikace-conversation-row'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

interface MessagePopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
}

export function MessagePopupDialog({ open, onOpenChange, companyId, companyName }: MessagePopupDialogProps) {
  const { userId } = useAccountantUser()
  const [conversations, setConversations] = useState<ConversationWithContext[]>([])
  const [selectedConv, setSelectedConv] = useState<ConversationWithContext | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!userId || !open) return
    try {
      const res = await fetch(`/api/accountant/conversations?company_id=${companyId}&status=open`, {
        headers: { 'x-user-id': userId },
      })
      if (!res.ok) return
      const data = await res.json()
      const filtered: ConversationWithContext[] = data.conversations || []
      setConversations(filtered)
      if (filtered.length > 0 && !selectedConv) {
        setSelectedConv(filtered[0])
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [userId, open, companyId, selectedConv])

  useEffect(() => {
    if (open) {
      setLoading(true)
      setSelectedConv(null)
      fetchConversations()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                {companyName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {conversations.length > 0
                  ? `${conversations.length} otevren${conversations.length === 1 ? 'a' : 'ych'} konverzac${conversations.length === 1 ? 'e' : 'i'}`
                  : 'Zadne otevrene konverzace'
                }
              </DialogDescription>
            </div>
            <Link href={`/accountant/komunikace?view=needs_response`} onClick={() => onOpenChange(false)}>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-600 hover:text-purple-700">
                Otevrit v Komunikaci
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {/* Conversation tabs if multiple */}
          {conversations.length > 1 && (
            <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                    selectedConv?.id === conv.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {conv.subject}
                  {conv.unread_count > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedConv ? (
            <KomunikaceChatDetail
              conversation={selectedConv}
              onConversationChange={fetchConversations}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-muted-foreground">Zadne otevrene konverzace</p>
                <Link href={`/accountant/clients/${companyId}/messages`} onClick={() => onOpenChange(false)}>
                  <Button variant="link" size="sm" className="mt-2 text-purple-600">
                    Prejit na zpravy klienta
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
