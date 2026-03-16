'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Message {
  id: string
  sender_id?: string
  sender_name?: string
  text: string
  created_at: string
  is_read?: boolean
  is_own?: boolean
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'před chvílí'
  if (diffMins < 60) return `před ${diffMins} min`
  if (diffHours < 24) return `před ${diffHours}h`
  if (diffDays === 1) return 'včera'
  if (diffDays < 7) return `před ${diffDays} dny`

  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ClaimsClientMessagesPage() {
  const params = useParams()
  const companyId = params.companyId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newText, setNewText] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/messages?company_id=${companyId}`)
      if (res.status === 404) {
        setMessages([])
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : (data.messages ?? []))
    } catch (err) {
      toast.error('Nepodařilo se načíst zprávy')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = newText.trim()
    if (!text || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/claims/messages?company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNewText('')
      await fetchMessages()
      textareaRef.current?.focus()
    } catch {
      toast.error('Zprávu se nepodařilo odeslat')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link
          href={`/claims/clients/${companyId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na klienta
        </Link>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Zprávy</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Komunikace k pojistné události</p>
          </div>
        </div>

        {/* Message list */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
                <MessageSquare className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Zatím žádné zprávy</p>
              <p className="text-xs text-gray-400 mt-1">Napište první zprávu níže</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = msg.is_own ?? false
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender name */}
                    {msg.sender_name && (
                      <span className="text-[11px] text-gray-400 px-1">
                        {msg.sender_name}
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Timestamp + read status */}
                    <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] text-gray-400">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                      {isOwn && msg.is_read !== undefined && (
                        <span className={`text-[10px] font-medium ${msg.is_read ? 'text-blue-500' : 'text-gray-400'}`}>
                          {msg.is_read ? 'Přečteno' : 'Odesláno'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </CardContent>

        {/* Input area */}
        <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napište zprávu… (Enter pro odeslání)"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-50 transition-colors"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newText.trim() || sending}
            className="h-[42px] w-[42px] p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
