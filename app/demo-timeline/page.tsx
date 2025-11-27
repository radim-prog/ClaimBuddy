'use client'

import { useState } from 'react'
import { FileText, CheckCircle, XCircle, AlertCircle, Send, Paperclip, MessageSquare, FileDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

// Mock data pro demo
const mockTimelineEvents = [
  {
    id: '1',
    type: 'document_upload',
    timestamp: '2025-01-15 10:00',
    title: 'Nahráno: Výpis z účtu (Leden 2025)',
    description: 'Klient nahrál výpis z účtu Fio banka',
    icon: FileText,
    color: 'blue',
    user: 'Karel Novák',
    comments: [
      { id: '1', user: 'Jana Svobodová', text: 'Díky, kontroluji...', time: '10:15' }
    ],
    attachments: [
      { name: 'vypis_uctu_01_2025.pdf', size: '245 KB' }
    ],
    expanded: false
  },
  {
    id: '2',
    type: 'urgence',
    timestamp: '2025-01-08 14:30',
    title: 'URGENCE: Chybí účtenky za leden',
    description: 'Automatická urgence odeslána SMS + Email',
    icon: AlertCircle,
    color: 'red',
    user: 'Systém',
    comments: [],
    attachments: [],
    expanded: false
  },
  {
    id: '3',
    type: 'document_upload',
    timestamp: '2025-01-10 11:00',
    title: 'Nahráno: 15 účtenek (Leden)',
    description: 'Hromadný upload účtenek',
    icon: FileText,
    color: 'blue',
    user: 'Karel Novák',
    comments: [
      { id: '2', user: 'Karel Novák', text: 'Poslal jsem všechny co jsem našel', time: '11:05' },
      { id: '3', user: 'Jana Svobodová', text: 'Super, díky! Zpracuji do zítřka.', time: '11:30' }
    ],
    attachments: [
      { name: 'uctenka_albert_01.jpg', size: '1.2 MB' },
      { name: 'uctenka_shell_02.jpg', size: '890 KB' },
      { name: 'uctenka_lidl_03.jpg', size: '1.5 MB' }
    ],
    expanded: false
  },
  {
    id: '4',
    type: 'approval',
    timestamp: '2025-01-12 16:45',
    title: 'SCHVÁLENO: Výpis z účtu',
    description: 'Dokument zkontrolován a schválen',
    icon: CheckCircle,
    color: 'green',
    user: 'Jana Svobodová',
    comments: [
      { id: '4', user: 'Jana Svobodová', text: 'V pořádku, odeslal jsem do Pohody', time: '16:50' }
    ],
    attachments: [],
    expanded: false
  },
  {
    id: '5',
    type: 'export',
    timestamp: '2025-01-15 10:00',
    title: 'EXPORT: Pohoda XML vygenerován',
    description: 'Data exportována do Pohoda účetního systému',
    icon: FileDown,
    color: 'purple',
    user: 'Jana Svobodová',
    comments: [],
    attachments: [
      { name: 'pohoda_export_2025-01.xml', size: '45 KB' }
    ],
    expanded: false
  }
]

const eventColors = {
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', icon: 'text-blue-600' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', icon: 'text-red-600' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', icon: 'text-purple-600' }
}

export default function DemoTimelinePage() {
  const [events, setEvents] = useState(mockTimelineEvents)
  const [newComment, setNewComment] = useState<{[key: string]: string}>({})

  const toggleEvent = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const addComment = (eventId: string) => {
    const comment = newComment[eventId]
    if (!comment?.trim()) return

    setEvents(events.map(e =>
      e.id === eventId
        ? {
            ...e,
            comments: [...e.comments, {
              id: Date.now().toString(),
              user: 'Ty',
              text: comment,
              time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
            }]
          }
        : e
    ))
    setNewComment({ ...newComment, [eventId]: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
            DEMO VERZE
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Timeline - Karel Novák s.r.o.
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Chronologický přehled všech událostí a dokumentů jako právnický spis</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-blue-300"></div>

          {/* Events */}
          <div className="space-y-6">
            {events.map((event) => {
              const Icon = event.icon
              const colors = eventColors[event.color as keyof typeof eventColors]

              return (
                <div key={event.id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-8 h-8 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center shadow-lg`}>
                    <Icon className={`h-4 w-4 ${colors.icon}`} />
                  </div>

                  <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]" onClick={() => toggleEvent(event.id)}>
                    <CardContent className="p-6">
                      {/* Event Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">{event.user}</span>
                            </span>
                            <span>•</span>
                            <span>{event.timestamp}</span>
                            {event.comments.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {event.comments.length} komentářů
                                </span>
                              </>
                            )}
                            {event.attachments.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {event.attachments.length} příloh
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {event.expanded && (
                        <div className="mt-6 pt-6 border-t space-y-6" onClick={(e) => e.stopPropagation()}>
                          {/* Attachments */}
                          {event.attachments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Přílohy ({event.attachments.length})
                              </h4>
                              <div className="space-y-2">
                                {event.attachments.map((att, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{att.name}</p>
                                      <p className="text-xs text-gray-500">{att.size}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">Stáhnout</Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Komentáře ({event.comments.length})
                            </h4>
                            <div className="space-y-3">
                              {event.comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold text-gray-900">{comment.user}</span>
                                    <span className="text-xs text-gray-500">• {comment.time}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                              ))}

                              {/* Add comment form */}
                              <div className="flex gap-2 mt-4">
                                <Textarea
                                  placeholder="Přidat komentář..."
                                  value={newComment[event.id] || ''}
                                  onChange={(e) => setNewComment({ ...newComment, [event.id]: e.target.value })}
                                  className="flex-1"
                                  rows={2}
                                />
                                <Button
                                  onClick={() => addComment(event.id)}
                                  className="self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Upload attachment button */}
                          <div className="pt-4 border-t">
                            <Button variant="outline" className="w-full">
                              <Paperclip className="h-4 w-4 mr-2" />
                              Přidat přílohu
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Section */}
        <Card className="mt-12 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Chat ke klientovi
            </h3>
            <div className="space-y-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-blue-900">Karel Novák</span>
                  <span className="text-xs text-blue-600">9:30</span>
                </div>
                <p className="text-sm text-blue-900">Dobrý den, posílám výpis z účtu</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-purple-900">Jana Svobodová</span>
                  <span className="text-xs text-purple-600">9:45</span>
                </div>
                <p className="text-sm text-purple-900">Výborně, zkontroluju to během dneška</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Napište zprávu..." className="flex-1" />
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
