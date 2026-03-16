'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DollarSign, TrendingUp, Users, CreditCard, ChevronDown, ChevronUp,
  Check, Clock, Banknote, Settings2, FileText,
} from 'lucide-react'

interface ProviderRevenue {
  id: string
  name: string
  revenue_share_pct: number
  markup_pct: number
  payout_method: string
  status: string
  stats: {
    transactions: number
    total_revenue: number
    commission: number
    platform_fee: number
  }
}

interface Payout {
  id: string
  provider_id: string
  provider_name: string | null
  period: string
  total_transactions: number
  total_revenue: number
  commission_total: number
  platform_fee_total: number
  status: string
  approved_at: string | null
  paid_at: string | null
  payout_reference: string | null
}

interface PluginPrice {
  id: string
  plugin_type: string
  base_price_czk: number
  description: string
  active: boolean
}

const pluginLabels: Record<string, string> = {
  extraction: 'Vytěžování',
  travel_randomizer: 'Kniha jízd AI',
  ai_precounting: 'AI předkontace',
}

const czk = (halere: number) => `${(halere / 100).toLocaleString('cs-CZ')} Kč`

export function OperationsRevenue() {
  const [tab, setTab] = useState<'summary' | 'payouts' | 'pricing'>('summary')
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [providers, setProviders] = useState<ProviderRevenue[]>([])
  const [totals, setTotals] = useState({ total_revenue: 0, total_commission: 0, total_platform_fee: 0, total_transactions: 0 })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [pricing, setPricing] = useState<PluginPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ revenue_share_pct: number; markup_pct: number }>({ revenue_share_pct: 10, markup_pct: 0 })

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/revenue?view=summary&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
        setTotals(data.totals || { total_revenue: 0, total_commission: 0, total_platform_fee: 0, total_transactions: 0 })
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/revenue?view=payouts`)
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts || [])
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  const fetchPricing = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/revenue?view=pricing`)
      if (res.ok) {
        const data = await res.json()
        setPricing(data.pricing || [])
      }
    } catch { toast.error('Chyba při načítání') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'summary') fetchSummary()
    else if (tab === 'payouts') fetchPayouts()
    else if (tab === 'pricing') fetchPricing()
  }, [tab, period])

  const handleAction = async (action: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/accountant/admin/revenue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      if (res.ok) {
        toast.success('Aktualizováno')
        if (tab === 'summary') fetchSummary()
        else if (tab === 'payouts') fetchPayouts()
        else fetchPricing()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba')
      }
    } catch { toast.error('Chyba') }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'summary', label: 'Přehled', icon: TrendingUp },
          { key: 'payouts', label: 'Výplaty', icon: Banknote },
          { key: 'pricing', label: 'Ceník pluginů', icon: Settings2 },
        ] as const).map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            <t.icon className="h-3.5 w-3.5 mr-1" />
            {t.label}
          </Button>
        ))}
      </div>

      {/* Period picker for summary */}
      {tab === 'summary' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Období:</span>
          <Input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-40 h-8 text-sm"
          />
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-6">Načítání...</p>
      ) : (
        <>
          {/* SUMMARY TAB */}
          {tab === 'summary' && (
            <div className="space-y-4">
              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Tržby</div>
                  <div className="text-lg font-bold">{czk(totals.total_revenue)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Provize</div>
                  <div className="text-lg font-bold text-orange-600">{czk(totals.total_commission)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Naše fee</div>
                  <div className="text-lg font-bold text-green-600">{czk(totals.total_platform_fee)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Transakcí</div>
                  <div className="text-lg font-bold">{totals.total_transactions}</div>
                </div>
              </div>

              {/* Provider list */}
              {providers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  <Users className="h-6 w-6 mx-auto mb-1 opacity-30" />
                  Žádní ověření poskytovatelé
                </p>
              ) : (
                <div className="space-y-2">
                  {providers.map(p => {
                    const isExpanded = expandedId === p.id
                    const isEditing = editingProvider === p.id
                    return (
                      <div key={p.id} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{p.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {p.revenue_share_pct}% podíl
                              </Badge>
                              {p.markup_pct > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 dark:bg-blue-900/20">
                                  +{p.markup_pct}% markup
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {p.stats.transactions} transakcí · Tržby {czk(p.stats.total_revenue)} · Provize {czk(p.stats.commission)}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t bg-gray-50/50 dark:bg-gray-800/30 space-y-3 pt-3">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Celkové tržby:</span>{' '}
                                <strong>{czk(p.stats.total_revenue)}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Provize ({p.revenue_share_pct}%):</span>{' '}
                                <strong className="text-orange-600">{czk(p.stats.commission)}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Naše fee:</span>{' '}
                                <strong className="text-green-600">{czk(p.stats.platform_fee)}</strong>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="flex items-end gap-2">
                                <div>
                                  <label className="text-xs text-muted-foreground">Podíl %</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={editValues.revenue_share_pct}
                                    onChange={e => setEditValues(v => ({ ...v, revenue_share_pct: Number(e.target.value) }))}
                                    className="h-8 w-24 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Markup %</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={200}
                                    step={1}
                                    value={editValues.markup_pct}
                                    onChange={e => setEditValues(v => ({ ...v, markup_pct: Number(e.target.value) }))}
                                    className="h-8 w-24 text-xs"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    handleAction('update_provider', {
                                      provider_id: p.id,
                                      revenue_share_pct: editValues.revenue_share_pct,
                                      markup_pct: editValues.markup_pct,
                                    })
                                    setEditingProvider(null)
                                  }}
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" /> Uložit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingProvider(null)}>
                                  Zrušit
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProvider(p.id)
                                    setEditValues({ revenue_share_pct: p.revenue_share_pct, markup_pct: p.markup_pct })
                                  }}
                                >
                                  <Settings2 className="h-3.5 w-3.5 mr-1" /> Upravit sazby
                                </Button>
                                {p.stats.transactions > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction('generate_payout', { provider_id: p.id, period })}
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1" /> Vygenerovat výplatu
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAYOUTS TAB */}
          {tab === 'payouts' && (
            <div className="space-y-2">
              {payouts.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  <Banknote className="h-6 w-6 mx-auto mb-1 opacity-30" />
                  Žádné výplaty
                </p>
              ) : (
                payouts.map(p => (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{p.provider_name || 'Poskytovatel'}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.period}</span>
                      </div>
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
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>Transakcí: <strong>{p.total_transactions}</strong></div>
                      <div>Tržby: <strong>{czk(p.total_revenue)}</strong></div>
                      <div>Provize: <strong className="text-orange-600">{czk(p.commission_total)}</strong></div>
                      <div>Fee: <strong className="text-green-600">{czk(p.platform_fee_total)}</strong></div>
                    </div>
                    {p.payout_reference && (
                      <div className="text-xs text-muted-foreground">Ref: {p.payout_reference}</div>
                    )}
                    <div className="flex gap-2">
                      {p.status === 'pending' && (
                        <Button size="sm" onClick={() => handleAction('approve_payout', { payout_id: p.id })}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Schválit
                        </Button>
                      )}
                      {p.status === 'approved' && (
                        <Button size="sm" onClick={() => handleAction('mark_paid', { payout_id: p.id })}>
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Označit zaplaceno
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRICING TAB */}
          {tab === 'pricing' && (
            <div className="space-y-2">
              {pricing.map(p => (
                <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pluginLabels[p.plugin_type] || p.plugin_type}</span>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-[10px]">
                        {p.active ? 'Aktivní' : 'Neaktivní'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.description} · Cena: {czk(p.base_price_czk)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      defaultValue={p.base_price_czk}
                      className="h-8 w-24 text-xs"
                      onBlur={e => {
                        const val = Number(e.target.value)
                        if (val !== p.base_price_czk) {
                          handleAction('update_pricing', { plugin_type: p.plugin_type, base_price_czk: val })
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">hal.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction('update_pricing', { plugin_type: p.plugin_type, active: !p.active })}
                    >
                      {p.active ? 'Deaktivovat' : 'Aktivovat'}
                    </Button>
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
