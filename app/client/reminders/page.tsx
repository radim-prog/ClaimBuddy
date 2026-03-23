'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Upload,
  FileText,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Reminder {
  id: string
  type: string
  message: string
  frequency: string
  escalation_level: number
  status: string
  channels: string[]
  metadata: Record<string, unknown>
  created_at: string
  resolved_at: string | null
  deliveries_sent: number
}

const typeConfig: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  missing_docs: { label: 'Doklady k doplnění', icon: Receipt, color: 'text-red-600' },
  deadline: { label: 'Termín', icon: Clock, color: 'text-amber-600' },
  unpaid_invoice: { label: 'Nezaplacená faktura', icon: FileText, color: 'text-orange-600' },
  custom: { label: 'Připomínka', icon: Bell, color: 'text-blue-600' },
}

const frequencyLabels: Record<string, string> = {
  daily: 'Denně',
  every_3_days: 'Každé 3 dny',
  weekly: 'Týdně',
  biweekly: 'Každých 14 dní',
  adaptive: 'Adaptivní',
}

function getEscalationBadge(level: number) {
  if (level >= 4) return { label: 'Kritické', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
  if (level >= 3) return { label: 'Urgentní', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  if (level >= 2) return { label: 'Důležité', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' }
  if (level >= 1) return { label: 'Střední', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' }
  return { label: 'Info', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
}

export default function ClientRemindersPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'resolved'>('active')

  useEffect(() => {
    setLoading(true)
    const status = tab === 'active' ? 'active' : 'resolved'
    fetch(`/api/client/reminders?status=${status}&limit=50`)
      .then(r => r.json())
      .then(d => setReminders(d.reminders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold font-display">Připomínky</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('active')}
        >
          <Bell className="h-3.5 w-3.5 mr-1.5" />
          Aktivní
        </Button>
        <Button
          variant={tab === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('resolved')}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Vyřešené
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && reminders.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            {tab === 'active' ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-green-700 dark:text-green-300">Žádné aktivní připomínky</p>
                <p className="text-sm text-muted-foreground mt-1">Všechny požadavky jsou splněny.</p>
              </>
            ) : (
              <>
                <BellOff className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-600 dark:text-gray-300">Žádné vyřešené připomínky</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reminder list */}
      {!loading && reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map(reminder => {
            const cfg = typeConfig[reminder.type] || typeConfig.custom
            const Icon = cfg.icon
            const badge = getEscalationBadge(reminder.escalation_level)
            const period = reminder.metadata?.period as string | undefined

            return (
              <Card key={reminder.id} className="rounded-2xl">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg bg-muted shrink-0')}>
                      <Icon className={cn('h-5 w-5', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{cfg.label}</span>
                        {tab === 'active' && (
                          <Badge className={cn('text-[10px] rounded-md', badge.className)}>
                            {badge.label}
                          </Badge>
                        )}
                        {tab === 'resolved' && (
                          <Badge className="text-[10px] rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Vyřešeno
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {period && <span>Období: {period}</span>}
                        <span>{frequencyLabels[reminder.frequency] || reminder.frequency}</span>
                        <span>{reminder.deliveries_sent}x odesláno</span>
                        <span>{new Date(reminder.created_at).toLocaleDateString('cs-CZ')}</span>
                      </div>
                      {tab === 'active' && reminder.type === 'missing_docs' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => router.push('/client/documents')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Nahrát doklady
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
