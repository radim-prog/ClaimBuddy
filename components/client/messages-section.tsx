'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Paperclip
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { cs } from 'date-fns/locale'

interface Message {
  id: string
  company_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  attachments?: { name: string; url: string }[]
}

interface MessagesSectionProps {
  companyId: string
  companyName?: string
  userName: string
}

export function MessagesSection({ companyId, companyName, userName }: MessagesSectionProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/messages?company_id=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    setLoading(true)
    fetchMessages()
    // Poll every 10 seconds for new messages
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          content: newMessage.trim(),
          sender_type: 'client',
          sender_name: userName,
        }),
      })

      if (res.ok) {
        setNewMessage('')
        await fetchMessages()
      }
    } catch {
      // silent fail
    } finally {
      setSending(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Zatím žádné zprávy</p>
            <p className="text-sm mt-1">
              Napište svému účetnímu{companyName ? ` ohledně ${companyName}` : ''}
            </p>
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

      {/* Message input - fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
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
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          Enter = odeslat, Shift+Enter = nový řádek
        </p>
      </div>
    </div>
  )
}
