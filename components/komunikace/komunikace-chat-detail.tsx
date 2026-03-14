'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
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
  MessageSquare,
  Clock,
  Building2,
  ListTodo,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import {
  type ConversationWithContext,
  formatMessageTime,
  getInitials,
  getWaitingDuration,
  SLA_COLORS,
} from './komunikace-conversation-row'

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

interface ChatDetailProps {
  conversation: ConversationWithContext
  onBack?: () => void
  onConversationChange?: () => void
  breadcrumbLabel?: string
}

export function KomunikaceChatDetail({ conversation, onBack, onConversationChange, breadcrumbLabel }: ChatDetailProps) {
  const { userId, userName } = useAccountantUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; url: string; storage_path: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(true)
  const prevCountRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!conversation.company_id || !userId) return
    try {
      const res = await fetch(
        `/api/accountant/companies/${conversation.company_id}/messages?chat_id=${conversation.id}`,
        { headers: { 'x-user-id': userId } }
      )
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { /* silent */ } finally {
      setLoadingMessages(false)
    }
  }, [conversation.id, conversation.company_id, userId])

  useEffect(() => {
    if (conversation.company_id) {
      setLoadingMessages(true)
      initialLoadRef.current = true
      prevCountRef.current = 0
      fetchMessages()
      fetch(`/api/accountant/companies/${conversation.company_id}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ action: 'mark_read', chat_id: conversation.id }),
      }).then(() => onConversationChange?.()).catch(() => {})
      const interval = setInterval(() => {
        if (!document.hidden) fetchMessages()
      }, 15_000)
      return () => clearInterval(interval)
    }
  }, [conversation.id, conversation.company_id, userId, fetchMessages, onConversationChange])

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
    if ((!newMessage.trim() && pendingAttachments.length === 0) || sending || !conversation.company_id) return
    setSending(true)
    try {
      const attachments = pendingAttachments.map(a => ({ name: a.name, url: a.url }))
      const content = newMessage.trim() || (attachments.length > 0 ? `Attach: ${attachments.map(a => a.name).join(', ')}` : '')
      const res = await fetch(`/api/accountant/companies/${conversation.company_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ chat_id: conversation.id, content, sender_name: userName || 'Ucetni', attachments: attachments.length > 0 ? attachments : undefined }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      setPendingAttachments([])
      onConversationChange?.()
    } catch { /* */ } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('chatId', conversation.id)
        if (conversation.company_id) formData.append('companyId', conversation.company_id)
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

  const handleComplete = async () => {
    if (!conversation.company_id) return
    await fetch(`/api/accountant/companies/${conversation.company_id}/messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
      body: JSON.stringify({ action: 'complete_conversation', chat_id: conversation.id }),
    }).catch(() => {})
    onConversationChange?.()
  }

  const handleReopen = async () => {
    if (!conversation.company_id) return
    await fetch(`/api/accountant/companies/${conversation.company_id}/messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
      body: JSON.stringify({ action: 'reopen_conversation', chat_id: conversation.id }),
    }).catch(() => {})
    onConversationChange?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className={`p-1.5 rounded-lg ${conversation.source_type === 'task' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
            {conversation.source_type === 'task' ? (
              <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="min-w-0">
            {breadcrumbLabel && (
              <button onClick={onBack} className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline mb-0.5 block">
                {breadcrumbLabel}
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{conversation.subject}</span>
              {conversation.status === 'completed' && (
                <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-[10px] py-0">Vyreseno</Badge>
              )}
              {conversation.waiting_since && conversation.last_responder === 'client' && (() => {
                const sla = getWaitingDuration(conversation.waiting_since)
                return (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SLA_COLORS[sla.level]}`}>
                    <Clock className="h-3 w-3" />
                    Ceka {sla.text}
                  </span>
                )
              })()}
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={conversation.source_url} className="text-xs text-purple-600 dark:text-purple-400 hover:underline truncate">
                {conversation.source_type === 'task' ? conversation.task_title : conversation.company_name}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {conversation.status === 'open' ? (
            <Button variant="ghost" size="sm" onClick={handleComplete} className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 text-xs gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vyresit</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleReopen} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8 text-xs gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Znovu otevrit</span>
            </Button>
          )}
          <Link href={conversation.source_url}>
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
      {conversation.status === 'open' && (
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

      {conversation.status === 'completed' && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 text-center">
          <p className="text-xs text-muted-foreground">
            Konverzace byla vyresena.{' '}
            <button onClick={handleReopen} className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Znovu otevrit</button>
          </p>
        </div>
      )}
    </div>
  )
}
