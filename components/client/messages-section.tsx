'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Paperclip,
  Loader2,
  Plus,
  CheckCircle,
  RotateCcw,
  MessageSquare,
  X,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'

interface Message {
  id: string
  company_id: string
  chat_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  attachments?: { name: string; url: string }[]
}

interface Conversation {
  id: string
  company_id: string
  subject: string
  status: 'open' | 'completed'
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  started_by: 'client' | 'accountant'
  completed_at: string | null
  created_at: string
}

interface MessagesSectionProps {
  companyId: string
  companyName?: string
  userName: string
}

export function MessagesSection({ companyId, companyName, userName }: MessagesSectionProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; url: string; storage_path: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef<number>(0)
  const initialLoadRef = useRef<boolean>(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apiBase = '/api/client/messages'

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}?company_id=${companyId}`)
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations ?? [])

      if (!selectedChatId && data.conversations?.length > 0) {
        const firstOpen = data.conversations.find((c: Conversation) => c.status === 'open')
        if (firstOpen) setSelectedChatId(firstOpen.id)
        else setSelectedChatId(data.conversations[0].id)
      }
    } catch {
      // silent
    } finally {
      setLoadingConversations(false)
    }
  }, [apiBase, companyId, selectedChatId])

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async () => {
    if (!selectedChatId) return
    try {
      const res = await fetch(`${apiBase}?company_id=${companyId}&chat_id=${selectedChatId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silent
    } finally {
      setLoadingMessages(false)
    }
  }, [apiBase, companyId, selectedChatId])

  // Initial fetch + polling
  useEffect(() => {
    setLoadingConversations(true)
    fetchConversations()
    const interval = setInterval(fetchConversations, 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (selectedChatId) {
      setLoadingMessages(true)
      initialLoadRef.current = true
      prevMessageCountRef.current = 0
      fetchMessages()
      const interval = setInterval(fetchMessages, 15_000)
      return () => clearInterval(interval)
    } else {
      setMessages([])
    }
  }, [selectedChatId, fetchMessages])

  // Auto-scroll
  useEffect(() => {
    if (!initialLoadRef.current && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    if (initialLoadRef.current && messages.length > 0) {
      initialLoadRef.current = false
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedChatId) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('companyId', companyId)
        formData.append('chatId', selectedChatId)

        const res = await fetch('/api/chat-attachments/upload', { method: 'POST', body: formData })
        if (!res.ok) continue
        const data = await res.json()
        setPendingAttachments(prev => [...prev, data.attachment])
      }
    } catch {
      // silent
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || sending || !selectedChatId) return

    setSending(true)
    try {
      const attachments = pendingAttachments.map(a => ({ name: a.name, url: a.url }))
      const content = newMessage.trim() || (attachments.length > 0 ? `📎 ${attachments.map(a => a.name).join(', ')}` : '')

      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          chat_id: selectedChatId,
          content,
          sender_type: 'client',
          sender_name: userName,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      setPendingAttachments([])
      fetchConversations()
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const handleCreateConversation = async () => {
    if (!newSubject.trim() || creatingConversation) return

    setCreatingConversation(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_conversation',
          company_id: companyId,
          subject: newSubject.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const data = await res.json()
      setConversations(prev => [data.conversation, ...prev])
      setSelectedChatId(data.conversation.id)
      setShowNewConversation(false)
      setNewSubject('')
    } catch {
      // silent
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleCompleteConversation = async (chatId: string) => {
    try {
      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_conversation', chat_id: chatId }),
      })
      fetchConversations()
    } catch { /* silent */ }
  }

  const handleReopenConversation = async (chatId: string) => {
    try {
      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen_conversation', chat_id: chatId }),
      })
      fetchConversations()
    } catch { /* silent */ }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
    if (isYesterday(date)) return `Včera ${format(date, 'HH:mm', { locale: cs })}`
    return format(date, 'd.M. HH:mm', { locale: cs })
  }

  const formatConversationTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isToday(date)) return format(date, 'HH:mm', { locale: cs })
    if (isYesterday(date)) return 'Včera'
    return format(date, 'd.M.', { locale: cs })
  }

  const selectedConversation = conversations.find(c => c.id === selectedChatId)

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        {selectedConversation && (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-sm truncate">{selectedConversation.subject}</span>
              {selectedConversation.status === 'completed' && (
                <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                  Dokončeno
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedConversation.status === 'open' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCompleteConversation(selectedChatId!)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Dokončit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReopenConversation(selectedChatId!)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Znovu otevřít
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {!selectedChatId ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Vyberte konverzaci</p>
              <p className="text-sm mt-1">
                Nebo vytvořte novou pro komunikaci{companyName ? ` ohledně ${companyName}` : ''}
              </p>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Zatím žádné zprávy v této konverzaci</p>
            </div>
          ) : (
            messages.map((message) => {
              const isClient = message.sender_type === 'client'
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isClient ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={
                        isClient
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }
                    >
                      {message.sender_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`max-w-[75%] ${isClient ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isClient ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        isClient
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {isClient && (
                      <div className="flex justify-end mt-1">
                        {message.read_at ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            {att.name}
                          </a>
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
        {selectedChatId && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            {/* Pending attachments */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pendingAttachments.map((att, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                    <Paperclip className="h-3 w-3" />
                    {att.name}
                    <button onClick={() => setPendingAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Napište zprávu..."
                className="min-h-[48px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.zip"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  title="Připojit soubor"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sending}
                  className="h-8 w-8 flex-shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Enter = odeslat, Shift+Enter = nový řádek
            </p>
          </div>
        )}
      </div>

      {/* Conversation sidebar */}
      <div className="w-72 border-l bg-gray-50 dark:bg-gray-800/30 flex flex-col">
        {/* New conversation button */}
        <div className="p-3 border-b">
          {showNewConversation ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Nová konverzace</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setShowNewConversation(false); setNewSubject('') }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Téma konverzace..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateConversation()
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateConversation}
                disabled={!newSubject.trim() || creatingConversation}
              >
                {creatingConversation ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Vytvořit
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setShowNewConversation(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nová konverzace
            </Button>
          )}
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Zatím žádné konverzace</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChatId(conv.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/30 ${
                  conv.id === selectedChatId
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600'
                    : ''
                } ${conv.status === 'completed' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {conv.status === 'completed' ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{conv.subject}</span>
                    </div>
                    {conv.last_message_preview && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 pl-5">
                        {conv.last_message_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {formatConversationTime(conv.last_message_at || conv.created_at)}
                    </span>
                    {conv.unread_count > 0 && (
                      <Badge className="h-4 min-w-[16px] text-[10px] px-1 bg-blue-600 hover:bg-blue-600">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
