'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Clock, FileText, Banknote, Check, Pause, Play, Trash2,
  Plus, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { ReminderCreateDialog } from './reminder-create-dialog'

interface Reminder {
  id: string
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

interface ReminderListProps {
  companyId: string
  companyName?: string
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

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktivní', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  paused: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved: { label: 'Vyřešeno', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  expired: { label: 'Vypršelo', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

const frequencyLabels: Record<string, string> = {
  daily: 'Denně',
  every_3_days: 'Každé 3 dny',
  weekly: 'Týdně',
  biweekly: 'Každé 2 týdny',
  adaptive: 'Adaptivní',
}

export function ReminderList({ companyId, companyName }: ReminderListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAll, setShowAll] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/reminders?company_id=${companyId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setReminders(data.reminders || [])
      }
    } catch {}
  }, [companyId])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'resolve') => {
    try {
      const res = await fetch(`/api/accountant/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const labels = { pause: 'Pozastaveno', resume: 'Obnoveno', resolve: 'Vyřešeno' }
        toast.success(labels[action])
        fetchReminders()
      } else {
        toast.error('Chyba')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat připomínku?')) return
    try {
      const res = await fetch(`/api/accountant/reminders/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Smazáno')
        fetchReminders()
      } else {
        toast.error('Chyba')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const filtered = showAll ? reminders : reminders.filter(r => r.status === 'active' || r.status === 'paused')
  const activeCount = reminders.filter(r => r.status === 'active').length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={!showAll ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAll(false)}
          >
            Aktivní
            {activeCount > 0 && <Badge variant="secondary" className="ml-1.5">{activeCount}</Badge>}
          </Button>
          <Button
            variant={showAll ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAll(true)}
          >
            Všechny
          </Button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nová
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">
          {showAll ? 'Žádné připomínky' : 'Žádné aktivní připomínky'}
        </p>
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
              <div key={r.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium line-clamp-1">{r.message}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeLabels[r.type] || r.type}</Badge>
                      {r.escalation_level >= 3 && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(r.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                    {/* Delivery progress */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Doručení:</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 rounded-full h-1.5 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{r.delivery_stats.delivered}/{r.delivery_stats.total}</span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Frekvence:</span>
                        <span className="ml-1 font-medium">{frequencyLabels[r.frequency] || r.frequency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Eskalace:</span>
                        <span className="ml-1 font-medium">{r.escalation_level}/4</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kanály:</span>
                        <span className="ml-1 font-medium">{r.channels.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max:</span>
                        <span className="ml-1 font-medium">{r.max_deliveries} doručení</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {r.metadata && Object.keys(r.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {r.metadata.period ? <span>Období: <strong>{String(r.metadata.period)}</strong></span> : null}
                        {r.metadata.unmatched_count != null ? <span className="ml-2">Nespárováno: <strong>{String(r.metadata.unmatched_count)}</strong></span> : null}
                        {r.metadata.tax_impact != null ? <span className="ml-2">Daňový dopad: <strong>{Number(r.metadata.tax_impact).toLocaleString('cs-CZ')} Kč</strong></span> : null}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1">
                      {r.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'pause')}>
                            <Pause className="h-3 w-3 mr-1" /> Pozastavit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'resolve')}>
                            <Check className="h-3 w-3 mr-1" /> Vyřešit
                          </Button>
                        </>
                      )}
                      {r.status === 'paused' && (
                        <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'resume')}>
                          <Play className="h-3 w-3 mr-1" /> Obnovit
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="ml-auto text-red-500 hover:text-red-600" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReminderCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={companyId}
        companyName={companyName}
        onCreated={fetchReminders}
      />
    </div>
  )
}
