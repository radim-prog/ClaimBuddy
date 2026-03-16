'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DollarSign, Users, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Plus, Pause, XCircle, CreditCard, TrendingUp,
} from 'lucide-react'

interface Stats {
  active_clients: number
  total_mrr: number
  pending_amount: number
  overdue_amount: number
  overdue_count: number
  paid_this_month: number
}

interface Cycle {
  id: string
  company_id: string
  company_name: string | null
  period: string
  amount_due: number
  platform_fee: number
  provider_payout: number
  status: string
  due_date: string
  paid_at: string | null
  reminder_count: number
  escalation_level: number
}

interface Config {
  id: string
  company_id: string
  company_name: string | null
  monthly_fee_czk: number
  platform_fee_pct: number
  billing_day: number
  status: string
}

const czk = (halere: number) => `${(halere / 100).toLocaleString('cs-CZ')} Kč`

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  written_off: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Čeká', paid: 'Zaplaceno', overdue: 'Po splatnosti',
  cancelled: 'Zrušeno', written_off: 'Odpis',
}

const escalationLabels = ['Nová', 'Připomínka', 'Upomínka', 'Pozastavení']

export default function BillingPage() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [stats, setStats] = useState<Stats | null>(null)
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [overdue, setOverdue] = useState<Cycle[]>([])
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'configs'>('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConfig, setNewConfig] = useState({ company_id: '', monthly_fee_czk: '', billing_day: '1' })

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/billing?view=overview&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        if (!data.provider) {
          setStats(null)
          setCycles([])
          setOverdue([])
          return
        }
        setStats(data.stats)
        setCycles(data.cycles || [])
        setOverdue(data.overdue || [])
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/billing?view=configs')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data.configs || [])
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'overview') fetchOverview()
    else fetchConfigs()
  }, [tab, period])

  const handleAction = async (action: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/accountant/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      if (res.ok) {
        toast.success('Aktualizováno')
        if (tab === 'overview') fetchOverview()
        else fetchConfigs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba')
      }
    } catch { toast.error('Chyba') }
  }

  const handleAddConfig = async () => {
    if (!newConfig.company_id || !newConfig.monthly_fee_czk) {
      toast.error('Vyplňte ID firmy a měsíční poplatek')
      return
    }
    try {
      const res = await fetch('/api/accountant/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: newConfig.company_id,
          monthly_fee_czk: Math.round(Number(newConfig.monthly_fee_czk) * 100),
          billing_day: Number(newConfig.billing_day) || 1,
        }),
      })
      if (res.ok) {
        toast.success('Fakturace nastavena')
        setShowAddForm(false)
        setNewConfig({ company_id: '', monthly_fee_czk: '', billing_day: '1' })
        fetchConfigs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba')
      }
    } catch { toast.error('Chyba') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Fakturace klientů
        </h2>
        <div className="flex gap-2">
          <Button variant={tab === 'overview' ? 'default' : 'outline'} size="sm" onClick={() => setTab('overview')}>
            Přehled
          </Button>
          <Button variant={tab === 'configs' ? 'default' : 'outline'} size="sm" onClick={() => setTab('configs')}>
            Nastavení
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Načítání...</p>
      ) : tab === 'overview' ? (
        <div className="space-y-6">
          {/* Period picker */}
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-40 h-8 text-sm" />

          {/* KPI */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />Aktivní klienti</div>
                <div className="text-2xl font-bold mt-1">{stats.active_clients}</div>
                <div className="text-xs text-muted-foreground">MRR: {czk(stats.total_mrr)}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Čeká na platbu</div>
                <div className="text-2xl font-bold mt-1">{czk(stats.pending_amount)}</div>
                <div className="text-xs text-green-600">Zaplaceno: {czk(stats.paid_this_month)}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />Po splatnosti</div>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats.overdue_count}</div>
                <div className="text-xs text-red-500">Celkem: {czk(stats.overdue_amount)}</div>
              </div>
            </div>
          )}

          {/* Current period cycles */}
          <div>
            <h3 className="font-medium mb-2">Období {period}</h3>
            {cycles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné fakturační cykly</p>
            ) : (
              <div className="space-y-1">
                {cycles.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{c.company_name || c.company_id}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Splatnost: {new Date(c.due_date).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{czk(c.amount_due)}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[c.status] || ''}`}>
                        {statusLabels[c.status] || c.status}
                      </Badge>
                      {(c.status === 'pending' || c.status === 'overdue') && (
                        <Button size="sm" variant="outline" onClick={() => handleAction('mark_paid', { cycle_id: c.id })}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Zaplaceno
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue section */}
          {overdue.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Po splatnosti ({overdue.length})
              </h3>
              <div className="space-y-1">
                {overdue.map(c => (
                  <div key={c.id} className="border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{c.company_name || c.company_id}</span>
                      <div className="text-xs text-muted-foreground">
                        {c.period} · Splatnost: {new Date(c.due_date).toLocaleDateString('cs-CZ')} · {c.reminder_count} upomínek
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">{czk(c.amount_due)}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        c.escalation_level >= 3 ? 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200' :
                        c.escalation_level >= 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {escalationLabels[c.escalation_level]}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleAction('mark_paid', { cycle_id: c.id })}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => handleAction('write_off', { cycle_id: c.id })}>
                        Odpis
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CONFIGS TAB */
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Přidat klienta
            </Button>
          </div>

          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-sm font-medium">Nová fakturace</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">ID firmy (UUID)</label>
                  <Input
                    value={newConfig.company_id}
                    onChange={e => setNewConfig(v => ({ ...v, company_id: e.target.value }))}
                    placeholder="UUID firmy"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Měsíční poplatek (Kč)</label>
                  <Input
                    type="number"
                    value={newConfig.monthly_fee_czk}
                    onChange={e => setNewConfig(v => ({ ...v, monthly_fee_czk: e.target.value }))}
                    placeholder="5000"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Den splatnosti (1-28)</label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={newConfig.billing_day}
                    onChange={e => setNewConfig(v => ({ ...v, billing_day: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddConfig}>Uložit</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Zrušit</Button>
              </div>
            </div>
          )}

          {configs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Žádní klienti s nastavenou fakturací</p>
          ) : (
            <div className="space-y-1">
              {configs.map(c => (
                <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{c.company_name || c.company_id}</span>
                    <div className="text-xs text-muted-foreground">
                      {czk(c.monthly_fee_czk)}/měs · Splatnost {c.billing_day}. den · Fee {c.platform_fee_pct}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      c.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      c.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {c.status === 'active' ? 'Aktivní' : c.status === 'paused' ? 'Pozastaveno' : 'Zrušeno'}
                    </Badge>
                    {c.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction('update_config', { config_id: c.id, status: 'paused' })}>
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {c.status === 'paused' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction('update_config', { config_id: c.id, status: 'active' })}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {c.status !== 'cancelled' && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleAction('update_config', { config_id: c.id, status: 'cancelled' })}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
