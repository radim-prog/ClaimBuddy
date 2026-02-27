'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  MoreVertical,
  Pin,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

interface Message {
  id: string
  company_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  pinned?: boolean
  attachments?: { name: string; url: string }[]
}

interface AccountantMessagesSectionProps {
  companyId: string
  companyName: string
  clientName?: string
}

export function AccountantMessagesSection({ companyId, companyName, clientName }: AccountantMessagesSectionProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef<number>(0)
  const initialLoadRef = useRef<boolean>(true)
  const { userName } = useAccountantUser()

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/messages`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silently fail on polling
    } finally {
      setLoading(false)
    }
  }, [companyId])

  // Initial fetch + polling every 30s
  useEffect(() => {
    setLoading(true)
    fetchMessages()
    const interval = setInterval(fetchMessages, 30_000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Mark client messages as read when opening
  useEffect(() => {
    fetch(`/api/accountant/companies/${companyId}/messages`, { method: 'PATCH' }).catch(() => {})
  }, [companyId])

  useEffect(() => {
    if (!initialLoadRef.current && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    if (initialLoadRef.current && messages.length > 0) {
      initialLoadRef.current = false
      // Scroll to bottom on initial load
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          sender_name: userName || 'Účetní',
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
    } catch {
      // TODO: toast error
    } finally {
      setSending(false)
    }
  }

  const handlePin = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m
    ))
  }

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: cs })
    }
    if (isYesterday(date)) {
      return `Včera ${format(date, 'HH:mm', { locale: cs })}`
    }
    return format(date, 'd.M. HH:mm', { locale: cs })
  }

  const unreadFromClient = messages.filter(
    m => m.sender_type === 'client' && !m.read_at
  ).length

  const pinnedMessages = messages.filter(m => m.pinned)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Unread indicator */}
      {unreadFromClient > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
          <Badge variant="default" className="bg-blue-600">
            {unreadFromClient} nová zpráva
          </Badge>
          <span className="text-sm text-blue-700">od klienta {clientName || companyName}</span>
        </div>
      )}

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
            <Pin className="h-4 w-4" />
            Připnuté zprávy
          </div>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="text-sm text-amber-700 pl-6">
              {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
            </div>
          ))}
        </div>
      )}

      {/* Messages list */}
      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Zatím žádná komunikace s tímto klientem</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAccountant = message.sender_type === 'accountant'
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isAccountant ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback
                    className={
                      isAccountant
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }
                  >
                    {message.sender_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[75%] ${isAccountant ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isAccountant ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium text-muted-foreground">
                      {message.sender_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  </div>

                  <div className="flex items-start gap-1">
                    <div
                      className={`p-3 rounded-lg ${
                        isAccountant
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Message actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isAccountant ? 'end' : 'start'}>
                        <DropdownMenuItem onClick={() => handlePin(message.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          {message.pinned ? 'Odepnout' : 'Připnout'}
                        </DropdownMenuItem>
                        {isAccountant && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(message.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Smazat
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Message status for accountant messages */}
                  {isAccountant && (
                    <div className="flex justify-end mt-1">
                      {message.read_at ? (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                          Přečteno
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Check className="h-3 w-3" />
                          Odesláno
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
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
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napište zprávu klientovi..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              title="Připojit soubor"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="h-8 w-8 bg-purple-600 hover:bg-purple-700"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter pro odeslání, Shift+Enter pro nový řádek
        </p>
      </div>
    </div>
  )
}
