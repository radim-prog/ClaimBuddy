'use client'

import { useCallback, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, MessageCircle } from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { type ConversationWithContext, type ViewMode } from '@/components/komunikace/komunikace-conversation-row'
import { KomunikaceSwimlanes } from '@/components/komunikace/komunikace-swimlanes'
import { KomunikaceListView } from '@/components/komunikace/komunikace-list-view'
import { KomunikaceChatDetail } from '@/components/komunikace/komunikace-chat-detail'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { useActiveModule } from '@/lib/contexts/active-module-context'
import { FeatureGate } from '@/components/shared/feature-gate'

export default function KomunikacePage() {
  return (
    <FeatureGate feature="messages">
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <KomunikaceOrchestrator />
      </Suspense>
    </FeatureGate>
  )
}

function KomunikaceOrchestrator() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userId } = useAccountantUser()
  const { activeModule } = useActiveModule()
  const isClaims = activeModule === 'claims'

  // URL-driven state
  const currentView = searchParams.get('view') as ViewMode | null
  const currentChatId = searchParams.get('chat')

  // ─── Data fetching with cache ───

  const fetchConversations = useCallback(async () => {
    if (!userId) return { conversations: [] as ConversationWithContext[], total_unread: 0 }
    const moduleParam = isClaims ? '&module=claims' : ''
    const res = await fetch(`/api/accountant/conversations?limit=200${moduleParam}`, {
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) throw new Error('fetch failed')
    return await res.json() as { conversations: ConversationWithContext[]; total_unread: number }
  }, [userId, isClaims])

  const { data: convData, loading, refresh: refreshConversations } = useCachedFetch(
    `komunikace-${userId}`,
    fetchConversations,
    { pollInterval: 60_000, enabled: !!userId }
  )
  const conversations = convData?.conversations ?? []

  // ─── Categorize conversations ───

  const { needsResponse, awaitingClient, completed } = useMemo(() => {
    const nr: ConversationWithContext[] = []
    const ac: ConversationWithContext[] = []
    const comp: ConversationWithContext[] = []

    for (const c of conversations) {
      if (c.status === 'completed') {
        comp.push(c)
      } else if (c.waiting_since && c.last_responder === 'client') {
        nr.push(c)
      } else {
        ac.push(c)
      }
    }

    nr.sort((a, b) => {
      const aTime = a.waiting_since ? new Date(a.waiting_since).getTime() : Infinity
      const bTime = b.waiting_since ? new Date(b.waiting_since).getTime() : Infinity
      return aTime - bTime
    })
    ac.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime
    })
    comp.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime
    })

    return { needsResponse: nr, awaitingClient: ac, completed: comp }
  }, [conversations])

  // ─── Navigation helpers ───

  const navigateTo = useCallback((params: Record<string, string | null>) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v)
    }
    const qs = sp.toString()
    router.push(`/accountant/komunikace${qs ? `?${qs}` : ''}`)
  }, [router])

  const handleConversationClick = useCallback((chatId: string) => {
    navigateTo({ view: currentView, chat: chatId })
  }, [navigateTo, currentView])

  const handleShowAll = useCallback((view: string) => {
    navigateTo({ view })
  }, [navigateTo])

  const handleBackToOverview = useCallback(() => {
    navigateTo({})
  }, [navigateTo])

  const handleBackToList = useCallback(() => {
    navigateTo({ view: currentView })
  }, [navigateTo, currentView])

  // ─── Resolve selected conversation ───

  const selectedConv = currentChatId ? conversations.find(c => c.id === currentChatId) : null

  // Sibling conversations for the same company (for sidebar)
  const siblingConversations = useMemo(() => {
    if (!selectedConv?.company_id) return []
    return conversations.filter(c => c.company_id === selectedConv.company_id)
  }, [conversations, selectedConv?.company_id])

  // Get conversations for current view
  const currentViewConvs = currentView === 'needs_response' ? needsResponse
    : currentView === 'awaiting_client' ? awaitingClient
    : currentView === 'completed' ? completed
    : []

  // ─── Loading ───

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  // ─── Render ───

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30">
          <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Komunikace</h1>
          <p className="text-xs text-muted-foreground">
            {needsResponse.length > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-medium">{needsResponse.length} ceka na odpoved</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Vse zodpovezeno</span>
            )}
            {awaitingClient.length > 0 && <span> · {awaitingClient.length} ceka na klienta</span>}
            {completed.length > 0 && <span> · {completed.length} vyreseno</span>}
          </p>
        </div>
      </div>

      {/* Layer 4: Chat detail */}
      {currentChatId && selectedConv ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900" style={{ height: 'calc(100vh - 160px)' }}>
          <KomunikaceChatDetail
            conversation={selectedConv}
            siblingConversations={siblingConversations}
            onBack={currentView ? handleBackToList : handleBackToOverview}
            onConversationChange={refreshConversations}
            onSwitchConversation={handleConversationClick}
            breadcrumbLabel={currentView ? `Zpet na seznam` : 'Zpet na prehled'}
          />
        </div>
      ) : currentView ? (
        /* Layer 3: List view */
        <KomunikaceListView
          conversations={currentViewConvs}
          viewMode={currentView}
          onBack={handleBackToOverview}
          onConversationClick={handleConversationClick}
        />
      ) : (
        /* Layer 2: Swimlane overview */
        <KomunikaceSwimlanes
          needsResponse={needsResponse}
          awaitingClient={awaitingClient}
          completed={completed}
          onConversationClick={handleConversationClick}
          onShowAll={handleShowAll}
        />
      )}
    </div>
  )
}
