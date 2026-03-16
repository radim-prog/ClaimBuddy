'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  CreditCard, DollarSign, AlertTriangle, TrendingUp, Users, RefreshCw,
} from 'lucide-react'

interface AdminStats {
  active_configs: number
  total_mrr: number
  platform_fee_mrr: number
  period_paid: number
  period_pending: number
  overdue_total: number
  overdue_count: number
}

interface AdminCycle {
  id: string
  company_name: string | null
  provider_name: string | null
  period: string
  amount_due: number
  platform_fee: number
  provider_payout: number
  status: string
  due_date: string
  escalation_level: number
}

const czk = (halere: number) => `${(halere / 100).toLocaleString('cs-CZ')} Kč`

export function OperationsBilling() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [cycles, setCycles] = useState<AdminCycle[]>([])
  const [overdue, setOverdue] = useState<AdminCycle[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/billing?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setCycles(data.cycles || [])
        setOverdue(data.overdue || [])
      }
    } catch { toast.error('Chyba') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [period])

  const handleGenerateCycles = async () => {
    try {
      const res = await fetch('/api/accountant/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_cycles', period }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Vygenerováno ${data.created} cyklů`)
        fetchData()
      }
    } catch { toast.error('Chyba') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-40 h-8 text-sm" />
        <Button size="sm" variant="outline" onClick={handleGenerateCycles}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Generovat cykly
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-4">Načítání...</p>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Aktivních konfigurací</div>
                <div className="text-lg font-bold">{stats.active_configs}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">MRR</div>
                <div className="text-lg font-bold">{czk(stats.total_mrr)}</div>
                <div className="text-xs text-green-600">Fee: {czk(stats.platform_fee_mrr)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Zaplaceno / Čeká</div>
                <div className="text-lg font-bold text-green-600">{czk(stats.period_paid)}</div>
                <div className="text-xs text-muted-foreground">Čeká: {czk(stats.period_pending)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-red-600">Po splatnosti</div>
                <div className="text-lg font-bold text-red-600">{stats.overdue_count}</div>
                <div className="text-xs text-red-500">{czk(stats.overdue_total)}</div>
              </div>
            </div>
          )}

          {/* Cycles */}
          {cycles.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Fakturační cykly — {period}</h4>
              {cycles.map(c => (
                <div key={c.id} className="border rounded-lg p-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.company_name || '—'}</span>
                    <span className="text-xs text-muted-foreground ml-2">({c.provider_name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{czk(c.amount_due)}</span>
                    <span className="text-xs text-muted-foreground">fee {czk(c.platform_fee)}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      c.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      c.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      c.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {c.status === 'paid' ? 'OK' : c.status === 'overdue' ? 'Dluh' : c.status === 'pending' ? 'Čeká' : c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-red-600">Po splatnosti ({overdue.length})</h4>
              {overdue.map(c => (
                <div key={c.id} className="border border-red-200 dark:border-red-900/50 rounded-lg p-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.company_name || '—'}</span>
                    <span className="text-xs text-muted-foreground ml-2">({c.provider_name}) · {c.period}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">{czk(c.amount_due)}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      c.escalation_level >= 3 ? 'bg-red-200 text-red-900' :
                      c.escalation_level >= 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      L{c.escalation_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
