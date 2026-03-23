'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileSignature,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Dohoda, DohodaMesic } from '@/lib/types/dohodari'
import { DOHODA_TYPE_LABELS, DOHODA_STATUS_LABELS, PAYMENT_STATUS_LABELS, VYKAZ_STATUS_LABELS } from '@/lib/types/dohodari'

type InfoContent = {
  dpp: { title: string; limit: number; rules: string[] }
  dpc: { title: string; limit: number; rules: string[] }
}

export default function ClientDohodariPage() {
  const [dohody, setDohody] = useState<Dohoda[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [vykazy, setVykazy] = useState<Record<string, DohodaMesic[]>>({})
  const [info, setInfo] = useState<InfoContent | null>(null)
  const [loading, setLoading] = useState(true)

  // New timesheet form
  const [newVykaz, setNewVykaz] = useState<{ dohodaId: string; period: string; hodiny: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchDohody = useCallback(async () => {
    try {
      const [dRes, iRes] = await Promise.all([
        fetch('/api/client/dohodari?status=active'),
        fetch('/api/client/dohodari/info'),
      ])
      if (dRes.ok) setDohody((await dRes.json()).dohody || [])
      if (iRes.ok) setInfo((await iRes.json()).info || null)
    } catch {
      toast.error('Nepodařilo se načíst dohody')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDohody()
  }, [fetchDohody])

  const fetchVykazy = async (dohodaId: string) => {
    if (vykazy[dohodaId]) return
    try {
      const res = await fetch(`/api/client/dohodari/${dohodaId}/vykazy`)
      if (res.ok) {
        const data = await res.json()
        setVykazy(prev => ({ ...prev, [dohodaId]: data.vykazy || [] }))
      }
    } catch {
      toast.error('Nepodařilo se načíst výkazy')
    }
  }

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      fetchVykazy(id)
    }
  }

  const handleSubmitVykaz = async () => {
    if (!newVykaz || !newVykaz.hodiny || !newVykaz.period) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/client/dohodari/${newVykaz.dohodaId}/vykazy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: newVykaz.period, hodiny: Number(newVykaz.hodiny) }),
      })
      if (res.ok) {
        const data = await res.json()
        setVykazy(prev => ({
          ...prev,
          [newVykaz.dohodaId]: [data.vykaz, ...(prev[newVykaz.dohodaId] || [])],
        }))
        setNewVykaz(null)
      }
    } catch {
      toast.error('Nepodařilo se odeslat výkaz')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPeriod = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || ''}`}>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] || status}
    </span>
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Načítám...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileSignature className="h-6 w-6 text-indigo-600" />
        Moje dohody (DPP/DPČ)
      </h1>

      {/* Active agreements */}
      {dohody.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Zatím žádné aktivní dohody</p>
            <p className="text-sm mt-1">Dohody vám vytvoří váš účetní</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dohody.map(d => (
            <Card key={d.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                onClick={() => handleExpand(d.id)}
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {DOHODA_TYPE_LABELS[d.typ]}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      d.typ === 'dpp' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>{d.typ.toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {d.popis_prace} — {formatCurrency(d.sazba)}/hod
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    od {formatDate(d.platnost_od)}
                  </span>
                  {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {expandedId === d.id && (
                <div className="border-t p-4 space-y-4 bg-muted/20">
                  {/* Timesheets */}
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Výkazy práce
                    </h3>

                    {/* Submit new timesheet */}
                    {!newVykaz || newVykaz.dohodaId !== d.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mb-3"
                        onClick={() => setNewVykaz({ dohodaId: d.id, period: currentPeriod, hodiny: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Zadat hodiny za měsíc
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-background rounded border">
                        <Input
                          type="month"
                          value={newVykaz.period}
                          onChange={e => setNewVykaz({ ...newVykaz, period: e.target.value })}
                          className="w-40"
                        />
                        <Input
                          type="number"
                          placeholder="Hodiny"
                          value={newVykaz.hodiny}
                          onChange={e => setNewVykaz({ ...newVykaz, hodiny: e.target.value })}
                          className="w-24"
                        />
                        <Button size="sm" onClick={handleSubmitVykaz} disabled={submitting}>
                          <Send className="h-4 w-4 mr-1" />
                          {submitting ? 'Odesílám...' : 'Odeslat'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setNewVykaz(null)}>
                          Zrušit
                        </Button>
                      </div>
                    )}

                    {/* Existing timesheets */}
                    {(vykazy[d.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Zatím žádné výkazy</p>
                    ) : (
                      <div className="space-y-1">
                        {(vykazy[d.id] || []).map(v => (
                          <div key={v.id} className="flex items-center justify-between p-2 bg-background rounded text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono">{v.period}</span>
                              <span>{v.hodiny} hod</span>
                              <span className="font-medium">{formatCurrency(v.hruba_mzda)} hrubá</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{formatCurrency(v.cista_mzda)} čistá</span>
                              {getPaymentBadge(v.payment_status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Educational info section */}
      {info && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Co potřebujete vědět o DPP/DPČ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['dpp', 'dpc'] as const).map(typ => (
              <div key={typ}>
                <h4 className="font-medium text-sm mb-2">{info[typ].title}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {info[typ].rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
