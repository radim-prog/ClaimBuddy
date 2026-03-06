'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  StickyNote, FileText, Mail, Phone, Users, Clock,
  RefreshCw, CheckCircle, Send, Building, User, Settings,
  Plus, Eye, EyeOff,
} from 'lucide-react'
import { CaseTimelineEntry, CaseEventType, CASE_EVENT_TYPES } from '@/lib/types/project'
import { toast } from 'sonner'

interface CaseTimelineProps {
  projectId: string
  readOnly?: boolean
  apiBasePath?: string  // Override for client-side API, e.g. '/api/client/cases'
  openComposerSignal?: number
  onChanged?: () => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  StickyNote, FileText, Mail, Phone, Users, Clock,
  RefreshCw, CheckCircle, Send, Building, User, Settings,
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDayHeading(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function CaseTimeline({ projectId, readOnly = false, apiBasePath, openComposerSignal, onChanged }: CaseTimelineProps) {
  const [entries, setEntries] = useState<CaseTimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [eventType, setEventType] = useState<CaseEventType>('note')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const url = apiBasePath
      ? `${apiBasePath}/${projectId}/timeline`
      : `/api/projects/${projectId}/timeline`
    fetch(url)
      .then(r => r.json())
      .then(data => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, apiBasePath])

  useEffect(() => {
    if (readOnly) return
    if (openComposerSignal && openComposerSignal > 0) {
      setShowForm(true)
    }
  }, [openComposerSignal, readOnly])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setEntries([data.entry, ...entries])
        onChanged?.()
        setTitle('')
        setDescription('')
        setShowForm(false)
        toast.success('Záznam přidán')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleClientVisible = async (entryId: string, currentVisible: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_visible: !currentVisible }),
      })
      if (res.ok) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, client_visible: !currentVisible } : e
        ))
        onChanged?.()
        toast.success(!currentVisible ? 'Záznam zviditelněn pro klienta' : 'Záznam skryt pro klienta')
      } else {
        toast.error('Chyba při změně viditelnosti')
      }
    } catch {
      toast.error('Chyba při změně viditelnosti')
    }
  }

  const getEventIcon = (type: CaseEventType) => {
    const def = CASE_EVENT_TYPES.find(e => e.value === type)
    const Icon = def ? iconMap[def.icon] : StickyNote
    return Icon ? <Icon className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />
  }

  const getEventLabel = (type: CaseEventType) => {
    return CASE_EVENT_TYPES.find(e => e.value === type)?.label || type
  }

  const groupedEntries = Object.entries(
    entries.reduce<Record<string, CaseTimelineEntry[]>>((acc, entry) => {
      const key = new Date(entry.event_date).toISOString().slice(0, 10)
      if (!acc[key]) acc[key] = []
      acc[key].push(entry)
      return acc
    }, {})
  ).sort(([a], [b]) => b.localeCompare(a))

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Načítání...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Časová osa spisu</span>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {showForm ? 'Zrušit' : 'Přidat záznam'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-6 p-4 border rounded-lg bg-muted/50">
            <Select value={eventType} onValueChange={(v) => setEventType(v as CaseEventType)}>
              <SelectTrigger>
                <SelectValue placeholder="Typ události" />
              </SelectTrigger>
              <SelectContent>
                {CASE_EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {getEventIcon(type.value)}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Nadpis události"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              placeholder="Popis (volitelné)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !title.trim()}>
                {submitting ? 'Ukládání...' : 'Uložit'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Zrušit
              </Button>
            </div>
          </form>
        )}

        <ScrollArea className="h-[420px]">
          <div className="space-y-5">
            {groupedEntries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Zatím žádné záznamy v časové ose
              </div>
            ) : (
              groupedEntries.map(([day, dayEntries]) => (
                <div key={day} className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {formatDayHeading(day)}
                  </div>
                  {dayEntries.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {getEventIcon(entry.event_type)}
                        </div>
                        {index < dayEntries.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {getEventLabel(entry.event_type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.event_date)}
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() => toggleClientVisible(entry.id, entry.client_visible === true)}
                              className={`ml-auto p-1 rounded hover:bg-muted transition-colors ${
                                entry.client_visible === true ? 'text-blue-500' : 'text-muted-foreground'
                              }`}
                              title={entry.client_visible === true ? 'Viditelné pro klienta — klikni pro skrytí' : 'Skryté pro klienta — klikni pro zviditelnění'}
                            >
                              {entry.client_visible === true ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                        <h4 className="font-medium text-sm">{entry.title}</h4>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                        )}
                        {entry.created_by_name && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.created_by_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
