'use client'

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  MessageCircle,
  ListTodo,
  Building2,
  Loader2,
  ChevronRight,
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  CheckCircle,
  RotateCcw,
  MoreVertical,
  Pin,
  Trash2,
  X,
  Inbox,
  Archive,
  Clock,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'
import Link from 'next/link'

// ─── Types ───

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
  waiting_since: string | null
  last_responder: string | null
}

interface Message {
  id: string
  company_id: string
  chat_id: string
  sender_type: 'client' | 'accountant'
  sender_id?: string
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  pinned?: boolean
  attachments?: { name: string; url: string }[]
}

interface ClientGroup {
  clientId: string
  clientName: string
  conversations: ConversationWithContext[]
  oldestWaiting: Date | null
  waitingCount: number
  unreadCount: number
  isTask: boolean
}

type ViewMode = 'needs_response' | 'awaiting_client' | 'completed'

// ─── Helpers ───

function formatTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
  if (isYesterday(date)) return 'Vcera'
  return format(date, 'd.M.', { locale: cs })
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
  if (isYesterday(date)) return `Vcera ${format(date, 'HH:mm', { locale: cs })}`
  return format(date, 'd.M. HH:mm', { locale: cs })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getWaitingDuration(waitingSince: string | null): { text: string; level: 'ok' | 'warning' | 'danger' } {
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

const SLA_COLORS = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const

const SLA_DOT = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500 animate-pulse',
} as const

// ─── Main ───

export default function KomunikacePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <KomunikaceContent />
    </Suspense>
  )
}

function KomunikaceContent() {
  const searchParams = useSearchParams()
  const { userId, userName } = useAccountantUser()
  const [conversations, setConversations] = useState<ConversationWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('needs_response')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; url: string; storage_path: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(true)
  const prevCountRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Data fetching ───

  const fetchConversations = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/accountant/conversations?limit=200', {
        headers: { 'x-user-id': userId },
      })
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && conversations.length > 0) setSelectedId(chatId)
  }, [searchParams, conversations])

  // ─── Derived data: group & sort ───

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

    // Sort needs_response by waiting_since ASC (oldest waiting = most urgent = top)
    nr.sort((a, b) => {
      const aTime = a.waiting_since ? new Date(a.waiting_since).getTime() : Infinity
      const bTime = b.waiting_since ? new Date(b.waiting_since).getTime() : Infinity
      return aTime - bTime
    })
    // Sort awaiting_client by last_message_at DESC
    ac.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime
    })
    // Sort completed by last_message_at DESC
    comp.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime
    })

    return { needsResponse: nr, awaitingClient: ac, completed: comp }
  }, [conversations])

  // Group conversations by client
  const groupByClient = useCallback((convs: ConversationWithContext[]): ClientGroup[] => {
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
    // Sort groups: oldest waiting first
    groups.sort((a, b) => {
      if (a.oldestWaiting && b.oldestWaiting) return a.oldestWaiting.getTime() - b.oldestWaiting.getTime()
      if (a.oldestWaiting) return -1
      if (b.oldestWaiting) return 1
      return a.clientName.localeCompare(b.clientName, 'cs')
    })

    return groups
  }, [])

  // Current view data
  const currentConvs = viewMode === 'needs_response' ? needsResponse
    : viewMode === 'awaiting_client' ? awaitingClient
    : completed

  // Apply search filter
  const searchFiltered = searchQuery
    ? currentConvs.filter(c => {
        const q = searchQuery.toLowerCase()
        return c.subject.toLowerCase().includes(q) ||
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.task_title || '').toLowerCase().includes(q) ||
          (c.last_message_preview || '').toLowerCase().includes(q)
      })
    : currentConvs

  const clientGroups = groupByClient(searchFiltered)

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  // ─── Chat logic ───

  const selectedConv = conversations.find(c => c.id === selectedId)

  const fetchMessages = useCallback(async () => {
    if (!selectedId || !selectedConv?.company_id || !userId) return
    try {
      const res = await fetch(
        `/api/accountant/companies/${selectedConv.company_id}/messages?chat_id=${selectedId}`,
        { headers: { 'x-user-id': userId } }
      )
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { /* silent */ } finally {
      setLoadingMessages(false)
    }
  }, [selectedId, selectedConv?.company_id, userId])

  useEffect(() => {
    if (selectedId && selectedConv?.company_id) {
      setLoadingMessages(true)
      initialLoadRef.current = true
      prevCountRef.current = 0
      fetchMessages()
      fetch(`/api/accountant/companies/${selectedConv.company_id}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ action: 'mark_read', chat_id: selectedId }),
      }).then(() => fetchConversations()).catch(() => {})
      const interval = setInterval(fetchMessages, 15_000)
      return () => clearInterval(interval)
    } else {
      setMessages([])
    }
  }, [selectedId, selectedConv?.company_id, userId, fetchMessages, fetchConversations])

  useEffect(() => {
    if (!initialLoadRef.current && messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    if (initialLoadRef.current && messages.length > 0) {
      initialLoadRef.current = false
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }
    prevCountRef.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || sending || !selectedId || !selectedConv?.company_id) return
    setSending(true)
    try {
      const attachments = pendingAttachments.map(a => ({ name: a.name, url: a.url }))
      const content = newMessage.trim() || (attachments.length > 0 ? `📎 ${attachments.map(a => a.name).join(', ')}` : '')
      const res = await fetch(`/api/accountant/companies/${selectedConv.company_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ chat_id: selectedId, content, sender_name: userName || 'Ucetni', attachments: attachments.length > 0 ? attachments : undefined }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      setPendingAttachments([])
      fetchConversations()
    } catch { /* */ } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedId) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('chatId', selectedId)
        if (selectedConv?.company_id) formData.append('companyId', selectedConv.company_id)
        const res = await fetch('/api/chat-attachments/upload', { method: 'POST', body: formData })
        if (!res.ok) continue
        const data = await res.json()
        setPendingAttachments(prev => [...prev, data.attachment])
      }
    } catch { /* */ } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleComplete = async (chatId: string) => {
    const conv = conversations.find(c => c.id === chatId)
    if (!conv?.company_id) return
    await fetch(`/api/accountant/companies/${conv.company_id}/messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
      body: JSON.stringify({ action: 'complete_conversation', chat_id: chatId }),
    }).catch(() => {})
    fetchConversations()
  }

  const handleReopen = async (chatId: string) => {
    const conv = conversations.find(c => c.id === chatId)
    if (!conv?.company_id) return
    await fetch(`/api/accountant/companies/${conv.company_id}/messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
      body: JSON.stringify({ action: 'reopen_conversation', chat_id: chatId }),
    }).catch(() => {})
    fetchConversations()
  }

  // ─── Render ───

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-3">
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
            </p>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 min-h-0">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700">

          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat konverzace..."
                className="h-8 pl-8 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* View mode tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {([
              {
                key: 'needs_response' as ViewMode,
                label: 'Ceka na nas',
                count: needsResponse.length,
                icon: AlertTriangle,
                color: needsResponse.length > 0 ? 'text-red-600 dark:text-red-400' : '',
                badgeColor: 'bg-red-500 text-white',
              },
              {
                key: 'awaiting_client' as ViewMode,
                label: 'Ceka na klienta',
                count: awaitingClient.length,
                icon: Clock,
                color: '',
                badgeColor: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
              },
              {
                key: 'completed' as ViewMode,
                label: 'Vyreseno',
                count: completed.length,
                icon: Archive,
                color: '',
                badgeColor: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
              },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`flex-1 py-2.5 text-[11px] font-medium transition-colors relative ${
                  viewMode === tab.key
                    ? (tab.color || 'text-purple-600 dark:text-purple-400')
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${tab.badgeColor}`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {viewMode === tab.key && (
                  <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                    tab.key === 'needs_response' && needsResponse.length > 0 ? 'bg-red-500' : 'bg-purple-600 dark:bg-purple-400'
                  }`} />
                )}
              </button>
            ))}
          </div>

          {/* Conversation list — grouped by client */}
          <div className="flex-1 overflow-y-auto">
            {clientGroups.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Nic nenalezeno' : viewMode === 'needs_response' ? 'Vse zodpovezeno' : viewMode === 'completed' ? 'Zadne vyresene' : 'Zadne konverzace'}
                </p>
              </div>
            ) : (
              clientGroups.map(group => {
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
                      {/* SLA indicator */}
                      {slaInfo && viewMode === 'needs_response' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SLA_COLORS[slaInfo.level]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${SLA_DOT[slaInfo.level]}`} />
                          {slaInfo.text}
                        </span>
                      )}
                      {group.conversations.length > 1 && (
                        <span className="text-[10px] text-gray-400">{group.conversations.length}</span>
                      )}
                    </button>

                    {/* Conversations in group */}
                    {(!isCollapsed || showSingle) && group.conversations.map(conv => {
                      const isSelected = conv.id === selectedId
                      const hasUnread = conv.unread_count > 0
                      const convSla = conv.waiting_since ? getWaitingDuration(conv.waiting_since) : null

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedId(conv.id)}
                          className={`w-full text-left px-3 py-2.5 border-b border-gray-50 dark:border-gray-800/50 transition-all ${
                            showSingle ? '' : 'pl-8'
                          } ${
                            isSelected
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-600 dark:border-l-purple-400'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                              {conv.subject}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {convSla && viewMode === 'needs_response' && (
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SLA_DOT[convSla.level]}`} />
                              )}
                              {hasUnread && (
                                <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-red-500 hover:bg-red-500">{conv.unread_count}</Badge>
                              )}
                              <span className="text-[10px] text-gray-400">{formatTime(conv.last_message_at || conv.created_at)}</span>
                            </div>
                          </div>
                          {conv.last_message_preview && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{conv.last_message_preview}</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Chat ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vyberte konverzaci</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {needsResponse.length > 0
                    ? `${needsResponse.length} konverzaci ceka na vasi odpoved`
                    : 'Kliknete na konverzaci v seznamu vlevo'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${selectedConv.source_type === 'task' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    {selectedConv.source_type === 'task' ? (
                      <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{selectedConv.subject}</span>
                      {selectedConv.status === 'completed' && (
                        <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-[10px] py-0">Vyreseno</Badge>
                      )}
                      {selectedConv.waiting_since && selectedConv.last_responder === 'client' && (() => {
                        const sla = getWaitingDuration(selectedConv.waiting_since)
                        return (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SLA_COLORS[sla.level]}`}>
                            <Clock className="h-3 w-3" />
                            Ceka {sla.text}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link href={selectedConv.source_url} className="text-xs text-purple-600 dark:text-purple-400 hover:underline truncate">
                        {selectedConv.source_type === 'task' ? selectedConv.task_title : selectedConv.company_name}
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {selectedConv.status === 'open' ? (
                    <Button variant="ghost" size="sm" onClick={() => handleComplete(selectedId!)} className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 text-xs gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Vyresit</span>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleReopen(selectedId!)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8 text-xs gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Znovu otevrit</span>
                    </Button>
                  )}
                  <Link href={selectedConv.source_url}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground">
                      <span className="hidden sm:inline">Prejit</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><p className="text-sm">Zatim zadne zpravy</p></div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_type === 'accountant'
                    return (
                      <div key={msg.id} className={`flex gap-2.5 group ${isMine ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                          <AvatarFallback className={`text-xs ${isMine ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                            {getInitials(msg.sender_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[11px] font-medium text-muted-foreground">{msg.sender_name}</span>
                            <span className="text-[10px] text-gray-400">{formatMessageTime(msg.created_at)}</span>
                            {msg.pinned && <Pin className="h-2.5 w-2.5 text-amber-500" />}
                          </div>
                          <div className="flex items-start gap-1">
                            <div className={`px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"><MoreVertical className="h-3 w-3" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMine ? 'end' : 'start'}>
                                <DropdownMenuItem><Pin className="h-3.5 w-3.5 mr-2" />{msg.pinned ? 'Odepnout' : 'Pripnout'}</DropdownMenuItem>
                                {isMine && <DropdownMenuItem className="text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5 mr-2" />Smazat</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {isMine && (
                            <div className="flex justify-end mt-0.5">
                              {msg.read_at ? (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><CheckCheck className="h-3 w-3 text-blue-500" />Precteno</span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Check className="h-3 w-3" />Odeslano</span>
                              )}
                            </div>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {msg.attachments.map((att, i) => (
                                <a key={i} href={att.url} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Paperclip className="h-3 w-3" />{att.name}</a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              {selectedConv.status === 'open' && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50/30 dark:bg-gray-800/20">
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pendingAttachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">
                          <Paperclip className="h-3 w-3" />{att.name}
                          <button onClick={() => setPendingAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Napiste zpravu..."
                      className="min-h-[44px] max-h-[120px] resize-none text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    />
                    <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.zip" onChange={handleFileUpload} />
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-9 w-9 border-gray-200 dark:border-gray-700" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Pripojit soubor">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" onClick={handleSend} disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sending} className="h-9 w-9 bg-purple-600 hover:bg-purple-700">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Enter pro odeslani, Shift+Enter pro novy radek</p>
                </div>
              )}

              {selectedConv.status === 'completed' && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 text-center">
                  <p className="text-xs text-muted-foreground">
                    Konverzace byla vyresena.{' '}
                    <button onClick={() => handleReopen(selectedId!)} className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Znovu otevrit</button>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
