'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bug, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Monitor, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface BugReport {
  id: string
  user_id: string | null
  user_role: string | null
  description: string
  category: string | null
  url: string | null
  user_agent: string | null
  viewport: string | null
  client_logs: LogEntry[]
  status: string
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
}

interface LogEntry {
  ts: number
  type: string
  level?: string
  message: string
  data?: Record<string, unknown>
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Nový', variant: 'destructive' },
  in_progress: { label: 'Řeší se', variant: 'default' },
  resolved: { label: 'Vyřešeno', variant: 'secondary' },
  wont_fix: { label: 'Neřeší se', variant: 'outline' },
}

const CATEGORY_MAP: Record<string, string> = {
  button_broken: 'Nefunguje tlačítko',
  display_issue: 'Špatné zobrazení',
  error_message: 'Chybová hláška',
  other: 'Jiné',
}

function LogViewer({ logs }: { logs: LogEntry[] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Žádné logy</p>
  }

  const levelColors: Record<string, string> = {
    error: 'text-red-500',
    warn: 'text-amber-500',
    log: 'text-gray-500 dark:text-gray-400',
  }

  const typeColors: Record<string, string> = {
    console: 'text-blue-400',
    error: 'text-red-400',
    fetch: 'text-green-400',
    nav: 'text-purple-400',
    click: 'text-orange-400',
    custom: 'text-gray-400',
  }

  return (
    <div className="bg-gray-950 rounded-lg p-3 max-h-80 overflow-y-auto font-mono text-xs space-y-0.5">
      {logs.map((log, i) => {
        const time = new Date(log.ts).toLocaleTimeString('cs-CZ', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const color = log.level ? levelColors[log.level] || 'text-gray-400' : typeColors[log.type] || 'text-gray-400'
        return (
          <div key={i} className="flex gap-2 leading-relaxed hover:bg-white/5 px-1 rounded">
            <span className="text-gray-600 shrink-0">{time}</span>
            <span className={`shrink-0 uppercase w-14 ${typeColors[log.type] || 'text-gray-500'}`}>
              {log.type}
            </span>
            <span className={color}>{log.message}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/accountant/bug-reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleSave = async (id: string) => {
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch('/api/accountant/bug-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: editingStatus[id],
          resolution_note: editingNote[id],
        }),
      })
      if (res.ok) {
        toast.success('Report aktualizován')
        fetchReports()
      } else {
        toast.error('Nepodařilo se uložit')
      }
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const newCount = reports.filter(r => r.status === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Bug Reporty
            {newCount > 0 && (
              <Badge variant="destructive" className="rounded-full text-xs">
                {newCount} nových
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Nahlášené problémy od uživatelů</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny</SelectItem>
              <SelectItem value="new">Nové</SelectItem>
              <SelectItem value="in_progress">Řeší se</SelectItem>
              <SelectItem value="resolved">Vyřešené</SelectItem>
              <SelectItem value="wont_fix">Neřeší se</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </button>
        </div>
      </div>

      {reports.length === 0 && !loading && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bug className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Zatím žádné reporty</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reports.map((report) => {
          const expanded = expandedId === report.id
          const statusInfo = STATUS_MAP[report.status] || STATUS_MAP.new
          return (
            <Card key={report.id} className="shadow-soft-sm">
              <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setExpandedId(expanded ? null : report.id)
                  if (!expanded) {
                    setEditingStatus(prev => ({ ...prev, [report.id]: report.status }))
                    setEditingNote(prev => ({ ...prev, [report.id]: report.resolution_note || '' }))
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Bug className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {report.description.slice(0, 120)}{report.description.length > 120 ? '...' : ''}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {report.category && (
                          <span>{CATEGORY_MAP[report.category] || report.category}</span>
                        )}
                        {report.user_role && <span>{report.user_role}</span>}
                        {report.url && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <Globe className="h-3 w-3 shrink-0" />
                            {new URL(report.url).pathname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusInfo.variant} className="rounded-md">
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(report.created_at).toLocaleString('cs-CZ')}
                    </span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 px-4 pb-4 space-y-4 border-t">
                  {/* Full description */}
                  <div className="pt-3">
                    <p className="text-sm font-medium mb-1">Popis</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.description}</p>
                  </div>

                  {/* Meta info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {report.url && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">URL</p>
                        <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline truncate">
                          {new URL(report.url).pathname}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    {report.viewport && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Viewport</p>
                        <p className="flex items-center gap-1"><Monitor className="h-3 w-3" />{report.viewport}</p>
                      </div>
                    )}
                    {report.user_agent && (
                      <div className="col-span-2">
                        <p className="font-medium text-muted-foreground mb-0.5">User Agent</p>
                        <p className="truncate" title={report.user_agent}>{report.user_agent}</p>
                      </div>
                    )}
                  </div>

                  {/* Client logs */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Client logy ({report.client_logs?.length || 0})
                    </p>
                    <LogViewer logs={report.client_logs} />
                  </div>

                  {/* Status & resolution */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                    <div className="sm:w-48">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                      <Select
                        value={editingStatus[report.id] || report.status}
                        onValueChange={(v) => setEditingStatus(prev => ({ ...prev, [report.id]: v }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nový</SelectItem>
                          <SelectItem value="in_progress">Řeší se</SelectItem>
                          <SelectItem value="resolved">Vyřešeno</SelectItem>
                          <SelectItem value="wont_fix">Neřeší se</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Poznámka k řešení</p>
                      <Textarea
                        value={editingNote[report.id] ?? report.resolution_note ?? ''}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, [report.id]: e.target.value }))}
                        placeholder="Jak byl problém vyřešen..."
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => handleSave(report.id)}
                        disabled={saving[report.id]}
                      >
                        {saving[report.id] ? 'Ukládání...' : 'Uložit'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
