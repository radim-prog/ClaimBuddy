'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock
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
}

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    company_id: 'company-11',
    sender_type: 'accountant',
    sender_name: 'Marie Účetní',
    content: 'Dobrý den, potřebovala bych od vás výpis z banky za prosinec. Můžete mi ho prosím nahrát?',
    created_at: '2025-12-20T09:30:00Z',
    read_at: '2025-12-20T10:15:00Z',
  },
  {
    id: 'msg-2',
    company_id: 'company-11',
    sender_type: 'client',
    sender_name: 'Jan Horák',
    content: 'Dobrý den, výpis jsem právě nahrál do systému. Ještě tam najdete i dvě faktury od dodavatelů.',
    created_at: '2025-12-20T11:45:00Z',
    read_at: '2025-12-20T12:00:00Z',
  },
  {
    id: 'msg-3',
    company_id: 'company-11',
    sender_type: 'accountant',
    sender_name: 'Marie Účetní',
    content: 'Děkuji, dokumenty jsem přijala. Uzávěrku za prosinec budu mít hotovou do konce týdne.',
    created_at: '2025-12-20T14:20:00Z',
    read_at: '2025-12-20T15:00:00Z',
  },
  {
    id: 'msg-4',
    company_id: 'company-11',
    sender_type: 'accountant',
    sender_name: 'Marie Účetní',
    content: 'Ještě upozornění - termín pro podání přiznání k DPH je 25.1. Připravím ho příští týden.',
    created_at: '2025-12-22T08:00:00Z',
  },
]

export function MessagesSection({ companyId, companyName }: MessagesSectionProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load mock messages
    const companyMessages = mockMessages.filter(m => m.company_id === companyId)
    setMessages(companyMessages)
  }, [companyId])

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setSending(true)

    // Simulate sending message
    const message: Message = {
      id: `msg-${Date.now()}`,
      company_id: companyId,
      sender_type: 'client',
      sender_name: 'Klient', // TODO: Get from auth
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setSending(false)

    // TODO: Actually send to API
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

  const unreadCount = messages.filter(
    m => m.sender_type === 'accountant' && !m.read_at
  ).length

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Zprávy s účetním
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} nová
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Komunikace ohledně {companyName || 'vaší firmy'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Zatím žádné zprávy</p>
              <p className="text-sm">Napište svému účetnímu</p>
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
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }
                    >
                      {message.sender_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`max-w-[75%] ${isClient ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${isClient ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
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

                    {/* Message status for client messages */}
                    {isClient && (
                      <div className="flex justify-end mt-1">
                        {message.read_at ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
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
              placeholder="Napište zprávu..."
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
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter pro odeslání, Shift+Enter pro nový řádek
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
