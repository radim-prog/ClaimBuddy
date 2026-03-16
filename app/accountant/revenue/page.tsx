'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  TrendingUp, DollarSign, CreditCard, FileText, ChevronDown, ChevronUp,
  Banknote, Store,
} from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

interface Summary {
  period: string
  count: number
  total_revenue: number
  commission: number
  platform_fee: number
}

interface Transaction {
  id: string
  plugin_type: string
  company_name: string | null
  base_price: number
  markup_amount: number
  total_price: number
  commission_amount: number
  status: string
  created_at: string
}

interface Payout {
  id: string
  period: string
  total_transactions: number
  commission_total: number
  status: string
  paid_at: string | null
  payout_reference: string | null
}

const pluginLabels: Record<string, string> = {
  extraction: 'Vytěžování',
  travel_randomizer: 'Kniha jízd AI',
  ai_precounting: 'AI předkontace',
}

const czk = (halere: number) => `${(halere / 100).toLocaleString('cs-CZ')} Kč`

export default function RevenuePage() {
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [provider, setProvider] = useState<any>(null)
  const [summary, setSummary] = useState<Summary[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/revenue?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setProvider(data.provider)
        setSummary(data.summary || [])
        setTransactions(data.transactions || [])
        setPayouts(data.payouts || [])
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [period])

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Načítání...</p>
  }

  if (!provider && !isAdmin) {
    return (
      <div className="text-center py-12 space-y-3">
        <Store className="h-10 w-10 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">
          Nejste registrováni jako poskytovatel v marketplace.
        </p>
        <Button variant="outline" asChild>
          <a href="/accountant/marketplace/register">Registrovat se</a>
        </Button>
      </div>
    )
  }

  const currentSummary = summary.find(s => s.period === period)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue sharing
          </h2>
          <p className="text-sm text-muted-foreground">
            {provider ? (
              <>Podíl: {provider.revenue_share_pct}%{provider.markup_pct > 0 && ` · Markup: +${provider.markup_pct}%`}</>
            ) : (
              <>Admin přehled — všichni poskytovatelé</>
            )}
          </p>
        </div>
        <Input
          type="month"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="w-40 h-8 text-sm"
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Transakcí
          </div>
          <div className="text-2xl font-bold mt-1">{currentSummary?.count || 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Tržby klientů
          </div>
          <div className="text-2xl font-bold mt-1">{czk(currentSummary?.total_revenue || 0)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Vaše provize
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">{czk(currentSummary?.commission || 0)}</div>
        </div>
      </div>

      {/* Monthly summary history */}
      <div>
        <h3 className="font-medium mb-2">Měsíční přehled</h3>
        {summary.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Zatím žádné transakce</p>
        ) : (
          <div className="space-y-1">
            {summary.map(s => {
              const isExpanded = expandedPeriod === s.period
              const periodTxs = transactions.filter(t => t.created_at.startsWith(s.period))
              return (
                <div key={s.period} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedPeriod(isExpanded ? null : s.period)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{s.period}</span>
                      <span className="text-xs text-muted-foreground ml-3">
                        {s.count} transakcí · Provize: {czk(s.commission)}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50/50 dark:bg-gray-800/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b">
                            <th className="px-3 py-1.5 text-left">Datum</th>
                            <th className="px-3 py-1.5 text-left">Plugin</th>
                            <th className="px-3 py-1.5 text-left">Firma</th>
                            <th className="px-3 py-1.5 text-right">Cena</th>
                            <th className="px-3 py-1.5 text-right">Provize</th>
                            <th className="px-3 py-1.5 text-center">Stav</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodTxs.map(tx => (
                            <tr key={tx.id} className="border-b last:border-0">
                              <td className="px-3 py-1.5">{new Date(tx.created_at).toLocaleDateString('cs-CZ')}</td>
                              <td className="px-3 py-1.5">{pluginLabels[tx.plugin_type] || tx.plugin_type}</td>
                              <td className="px-3 py-1.5">{tx.company_name || '—'}</td>
                              <td className="px-3 py-1.5 text-right">{czk(tx.total_price)}</td>
                              <td className="px-3 py-1.5 text-right text-green-600">{czk(tx.commission_amount)}</td>
                              <td className="px-3 py-1.5 text-center">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {tx.status === 'paid_out' ? 'Vyplaceno' : tx.status === 'settled' ? 'Uzavřeno' : 'Čeká'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payouts */}
      {payouts.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Výplaty
          </h3>
          <div className="space-y-1">
            {payouts.map(p => (
              <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.period}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {p.total_transactions} transakcí · {czk(p.commission_total)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.payout_reference && (
                    <span className="text-xs text-muted-foreground">Ref: {p.payout_reference}</span>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      p.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      p.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }
                  >
                    {p.status === 'paid' ? 'Zaplaceno' : p.status === 'approved' ? 'Schváleno' : 'Čeká'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
