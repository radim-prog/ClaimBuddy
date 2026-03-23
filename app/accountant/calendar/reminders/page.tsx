'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Bell, Clock, FileText, Banknote, Check, Pause, Play, Trash2,
  Search, Filter, AlertTriangle, Send, ChevronDown, ChevronUp,
  BarChart3,
} from 'lucide-react'
import { ReminderCreateDialog } from '@/components/accountant/reminder-create-dialog'

interface Reminder {
  id: string
  company_id: string
  company_name: string | null
  type: string
  message: string
  frequency: string
  escalation_level: number
  status: string
  channels: string[]
  metadata: Record<string, unknown>
  max_deliveries: number
  created_at: string
  resolved_at: string | null
  delivery_stats: { total: number; delivered: number; failed: number; pending: number }
}

const typeIcons: Record<string, typeof Bell> = {
  deadline: Clock,
  missing_docs: FileText,
  unpaid_invoice: Banknote,
  custom: Bell,
}

const typeLabels: Record<string, string> = {
  deadline: 'Termín',
  missing_docs: 'Doklady',
  unpaid_invoice: 'Faktura',
  custom: 'Vlastní',
}

const typeColors: Record<string, string> = {
  deadline: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  missing_docs: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  unpaid_invoice: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const statusConfig: Record<string, { label: string; color: string; bgCard: string }> = {
  active: { label: 'Aktivní', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', bgCard: '' },
  paused: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', bgCard: 'opacity-60' },
  resolved: { label: 'Vyřešeno', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', bgCard: 'opacity-50' },
  expired: { label: 'Vypršelo', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', bgCard: 'opacity-50' },
}

const frequencyLabels: Record<string, string> = {
  daily: 'Denně',
  every_3_days: 'Každé 3 dny',
  weekly: 'Týdně',
  biweekly: 'Každé 2 týdny',
  adaptive: 'Adaptivní',
}

type StatusFilter = 'active' | 'resolved' | 'all'
type TypeFilter = string | 'all'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (companyFilter !== 'all') params.set('company_id', companyFilter)

      const res = await fetch(`/api/accountant/reminders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReminders(data.reminders || [])
        setTotal(data.total || 0)
      }
    } catch {
      toast.error('Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, companyFilter])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  // Load companies for filter
  useEffect(() => {
    fetch('/api/accountant/companies')
      .then(r => r.json())
      .then(data => {
        const list = (data.companies || data || []).map((c: any) => ({ id: c.id, name: c.name }))
        setCompanies(list.sort((a: any, b: any) => a.name.localeCompare(b.name, 'cs')))
      })
      .catch(() => {})
  }, [])

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'resolve') => {
    try {
      const res = await fetch(`/api/accountant/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(action === 'pause' ? 'Pozastaveno' : action === 'resume' ? 'Obnoveno' : 'Vyřešeno')
        fetchReminders()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat připomínku a všechna doručení?')) return
    try {
      const res = await fetch(`/api/accountant/reminders/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Smazáno')
        fetchReminders()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // Client-side text search
  const filtered = search.trim()
    ? reminders.filter(r =>
        r.message.toLowerCase().includes(search.toLowerCase()) ||
        (r.company_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : reminders

  // Stats
  const activeCount = reminders.filter(r => r.status === 'active').length
  const pausedCount = reminders.filter(r => r.status === 'paused').length
  const highEscalation = reminders.filter(r => r.status === 'active' && r.escalation_level >= 3).length

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Send className="h-6 w-6 text-purple-600" />
            Připomínky
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Přehled automatických i manuálních připomínek pro klienty
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Bell className="h-4 w-4 mr-2" />
          Nová připomínka
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Aktivních</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-yellow-600">{pausedCount}</div>
            <div className="text-xs text-muted-foreground">Pozastavených</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-orange-600">{highEscalation}</div>
            <div className="text-xs text-muted-foreground">Vysoká eskalace</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Celkem</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {(['active', 'resolved', 'all'] as StatusFilter[]).map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'active' ? 'Aktivní' : s === 'resolved' ? 'Dokončené' : 'Vše'}
            </Button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">Všechny typy</option>
          <option value="deadline">Termín</option>
          <option value="missing_docs">Doklady</option>
          <option value="unpaid_invoice">Faktura</option>
          <option value="custom">Vlastní</option>
        </select>

        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-800 text-sm max-w-[200px]"
        >
          <option value="all">Všechny firmy</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Reminder list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Načítání...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Žádné připomínky</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const Icon = typeIcons[r.type] || Bell
            const sc = statusConfig[r.status] || statusConfig.active
            const isExpanded = expandedId === r.id
            const progress = r.delivery_stats.total > 0
              ? Math.round((r.delivery_stats.delivered / r.delivery_stats.total) * 100)
              : 0

            return (
              <Card key={r.id} className={`rounded-xl ${sc.bgCard}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.message}</span>
                      {r.escalation_level >= 3 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {r.company_name && (
                        <span className="text-xs text-muted-foreground font-medium">{r.company_name}</span>
                      )}
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[r.type] || ''}`}>{typeLabels[r.type] || r.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{frequencyLabels[r.frequency] || r.frequency}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(r.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    {/* Progress bar inline */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div className="bg-purple-500 rounded-full h-1 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{r.delivery_stats.delivered}/{r.delivery_stats.total}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 border-t space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3">
                      <div>
                        <span className="text-muted-foreground">Eskalace:</span>
                        <span className="ml-1 font-medium">{r.escalation_level}/4</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kanály:</span>
                        <span className="ml-1 font-medium">{r.channels.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Doručeno:</span>
                        <span className="ml-1 font-medium">{r.delivery_stats.delivered}</span>
                        {r.delivery_stats.failed > 0 && <span className="text-red-500 ml-1">({r.delivery_stats.failed} se nezdařilo)</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Čeká:</span>
                        <span className="ml-1 font-medium">{r.delivery_stats.pending}</span>
                      </div>
                    </div>

                    {r.metadata && Object.keys(r.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        {r.metadata.period ? <span>Období: <strong>{String(r.metadata.period)}</strong></span> : null}
                        {r.metadata.unmatched_count != null ? <span>Nespárováno: <strong>{String(r.metadata.unmatched_count)}</strong></span> : null}
                        {r.metadata.tax_impact != null ? <span>Daňový dopad: <strong>{Number(r.metadata.tax_impact).toLocaleString('cs-CZ')} Kč</strong></span> : null}
                      </div>
                    )}

                    {r.resolved_at && (
                      <div className="text-xs text-muted-foreground">
                        Vyřešeno: {new Date(r.resolved_at).toLocaleString('cs-CZ')}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {r.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'pause')}>
                            <Pause className="h-3.5 w-3.5 mr-1" /> Pozastavit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'resolve')}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Vyřešit
                          </Button>
                        </>
                      )}
                      {r.status === 'paused' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'resume')}>
                            <Play className="h-3.5 w-3.5 mr-1" /> Obnovit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'resolve')}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Vyřešit
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="ml-auto text-red-500 hover:text-red-600" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Smazat
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create dialog — needs a company selection */}
      <ReminderCreateWithCompanySelect
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
        onCreated={fetchReminders}
      />
    </div>
  )
}

/** Wrapper that adds company selection to the create dialog */
function ReminderCreateWithCompanySelect({
  open,
  onOpenChange,
  companies,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null)
  const [companySearch, setCompanySearch] = useState('')

  if (open && !selectedCompany) {
    const filteredCompanies = companySearch.trim()
      ? companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
      : companies

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-3">Vyberte klienta</h3>
          <Input
            placeholder="Hledat firmu..."
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)}
            className="mb-3"
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredCompanies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompany(c)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm transition-colors"
              >
                {c.name}
              </button>
            ))}
            {filteredCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné výsledky</p>
            )}
          </div>
          <Button variant="outline" className="w-full mt-3" onClick={() => onOpenChange(false)}>Zrušit</Button>
        </div>
      </div>
    )
  }

  if (!selectedCompany) return null

  return (
    <ReminderCreateDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedCompany(null)
        onOpenChange(v)
      }}
      companyId={selectedCompany.id}
      companyName={selectedCompany.name}
      onCreated={() => {
        setSelectedCompany(null)
        onCreated()
      }}
    />
  )
}
