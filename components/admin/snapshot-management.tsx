'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Archive,
  Plus,
  Play,
  Trash2,
  RefreshCw,
  CalendarClock,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────

type Schedule = 'daily' | 'weekly' | 'monthly'

interface SnapshotJob {
  id: string
  firm_id: string
  company_id: string
  schedule: Schedule
  retention_days: number
  enabled: boolean
  last_run: string | null
  snapshot_count: number
  created_at: string
  companies: { name: string } | null
}

interface Company {
  id: string
  name: string
}

// ── Helpers ────────────────────────────────────────────────────

const SCHEDULE_LABELS: Record<Schedule, string> = {
  daily:   'Denně',
  weekly:  'Týdně',
  monthly: 'Měsíčně',
}

const SCHEDULE_COLORS: Record<Schedule, string> = {
  daily:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  weekly:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  monthly: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

function formatLastRun(lastRun: string | null): string {
  if (!lastRun) return 'Nikdy'
  return new Date(lastRun).toLocaleString('cs-CZ', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ── Main Component ─────────────────────────────────────────────

export function SnapshotManagement({ firmId, companies }: {
  firmId: string
  companies: Company[]
}) {
  const [jobs, setJobs]             = useState<SnapshotJob[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())

  // ── Fetch jobs ──

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/snapshots?firm_id=${firmId}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      } else {
        toast.error('Nepodařilo se načíst zálohovací úlohy')
      }
    } catch {
      toast.error('Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [firmId])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  // ── Toggle enabled ──

  const toggleEnabled = async (job: SnapshotJob) => {
    try {
      const res = await fetch(`/api/accountant/admin/snapshots?id=${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      })
      if (res.ok) {
        toast.success(job.enabled ? 'Úloha pozastavena' : 'Úloha aktivována')
        fetchJobs()
      } else {
        toast.error('Nepodařilo se změnit stav')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // ── Delete job ──

  const deleteJob = async (jobId: string) => {
    if (!confirm('Opravdu smazat tuto zálohovací úlohu?')) return
    try {
      const res = await fetch(`/api/accountant/admin/snapshots?id=${jobId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Úloha smazána')
        setJobs(prev => prev.filter(j => j.id !== jobId))
      } else {
        toast.error('Nepodařilo se smazat')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // ── Run now ──

  const runNow = async (job: SnapshotJob) => {
    if (runningIds.has(job.id)) return
    setRunningIds(prev => new Set(prev).add(job.id))
    try {
      const res = await fetch('/api/cron/snapshots', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.failed === 0) {
          toast.success(`Záloha provedena (${data.succeeded} úspěšných)`)
        } else {
          toast.error(`Záloha skončila s chybami (${data.failed} se nezdařilo)`)
        }
        fetchJobs()
      } else {
        toast.error('Chyba při spuštění zálohy')
      }
    } catch {
      toast.error('Chyba')
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    }
  }

  // ── Render ──

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Zálohovací úlohy</span>
          {jobs.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {jobs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchJobs} className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Obnovit
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Nová úloha
          </Button>
        </div>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center italic">
          Žádné zálohovací úlohy. Klikněte na &ldquo;Nová úloha&rdquo; pro přidání.
        </p>
      ) : (
        <div className="divide-y dark:divide-gray-800 border rounded-lg overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_90px_70px_120px_50px_88px] gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Firma</span>
            <span>Plán</span>
            <span>Retence</span>
            <span>Poslední záloha</span>
            <span className="text-center">Počet</span>
            <span></span>
          </div>

          {jobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              running={runningIds.has(job.id)}
              onToggle={() => toggleEnabled(job)}
              onDelete={() => deleteJob(job.id)}
              onRunNow={() => runNow(job)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateJobDialog
        open={showCreate}
        firmId={firmId}
        companies={companies}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); fetchJobs() }}
      />
    </div>
  )
}

// ── Job Row ────────────────────────────────────────────────────

function JobRow({ job, running, onToggle, onDelete, onRunNow }: {
  job: SnapshotJob
  running: boolean
  onToggle: () => void
  onDelete: () => void
  onRunNow: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_90px_70px_120px_50px_88px] gap-2 px-3 py-2.5 items-center hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
      {/* Company name + status */}
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">
          {job.companies?.name || job.company_id.slice(0, 8) + '…'}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {job.enabled ? (
            <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
          ) : (
            <Clock className="h-2.5 w-2.5 text-gray-400" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {job.enabled ? 'Aktivní' : 'Pozastaveno'}
          </span>
        </div>
      </div>

      {/* Schedule badge */}
      <div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-1 ${SCHEDULE_COLORS[job.schedule]}`}
        >
          <CalendarClock className="h-2.5 w-2.5" />
          {SCHEDULE_LABELS[job.schedule]}
        </Badge>
      </div>

      {/* Retention */}
      <div className="text-xs text-muted-foreground">
        {job.retention_days} dní
      </div>

      {/* Last run */}
      <div className="text-[11px] text-muted-foreground">
        {formatLastRun(job.last_run)}
      </div>

      {/* Count */}
      <div className="text-center text-xs font-medium">
        {job.snapshot_count}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
          title={job.enabled ? 'Pozastavit' : 'Aktivovat'}
        >
          {job.enabled
            ? <ToggleRight className="h-4 w-4 text-green-500" />
            : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          }
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRunNow}
          disabled={running}
          title="Spustit zálohu nyní"
        >
          {running
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Play className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          }
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
          onClick={onDelete}
          title="Smazat úlohu"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Create Job Dialog ──────────────────────────────────────────

function CreateJobDialog({ open, firmId, companies, onClose, onCreated }: {
  open: boolean
  firmId: string
  companies: Company[]
  onClose: () => void
  onCreated: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    company_id:     '',
    schedule:       'weekly' as Schedule,
    retention_days: '30',
  })

  const handleSubmit = async () => {
    if (!form.company_id) {
      toast.error('Vyberte klientskou firmu')
      return
    }

    const retentionNum = parseInt(form.retention_days, 10)
    if (isNaN(retentionNum) || retentionNum < 1) {
      toast.error('Retence musí být alespoň 1 den')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/accountant/admin/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_id:        firmId,
          company_id:     form.company_id,
          schedule:       form.schedule,
          retention_days: retentionNum,
        }),
      })

      if (res.ok) {
        toast.success('Zálohovací úloha vytvořena')
        setForm({ company_id: '', schedule: 'weekly', retention_days: '30' })
        onCreated()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při vytváření')
      }
    } catch {
      toast.error('Chyba')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Archive className="h-4 w-4" />
            Nová zálohovací úloha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Company select */}
          <div>
            <Label className="text-xs">Klientská firma *</Label>
            <Select
              value={form.company_id}
              onValueChange={v => setForm(p => ({ ...p, company_id: v }))}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue placeholder="Vyberte firmu..." />
              </SelectTrigger>
              <SelectContent>
                {companies.length === 0 ? (
                  <SelectItem value="_none" disabled>Žádné firmy</SelectItem>
                ) : (
                  companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule + retention side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frekvence *</Label>
              <Select
                value={form.schedule}
                onValueChange={v => setForm(p => ({ ...p, schedule: v as Schedule }))}
              >
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Denně</SelectItem>
                  <SelectItem value="weekly">Týdně</SelectItem>
                  <SelectItem value="monthly">Měsíčně</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Retence (dnů)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.retention_days}
                onChange={e => setForm(p => ({ ...p, retention_days: e.target.value }))}
                className="mt-1 h-8 text-sm"
                placeholder="30"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Zrušit
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Vytvářím...' : 'Vytvořit úlohu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
