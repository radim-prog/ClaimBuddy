'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Search,
  UserPlus,
  UserMinus,
  Save,
  X,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface ClientRow {
  id: string
  name: string
  ico: string
  group_name: string | null
  status: string
  billing_settings: { monthly_fee?: number; client_since?: string } | null
  created_at: string
}

type FilterStatus = 'all' | 'active' | 'churned' | 'paused' | 'onboarding'

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktivní',
  churned: 'Odešel',
  paused: 'Pozastavený',
  onboarding: 'Onboarding',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  churned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  onboarding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

function formatCurrency(n: number) {
  return n.toLocaleString('cs', { maximumFractionDigits: 0 }) + ' Kč'
}

export default function ClientsRevenuePage() {
  const [companies, setCompanies] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFee, setEditFee] = useState('')
  const [showChurnModal, setShowChurnModal] = useState<string | null>(null)
  const [churnNotes, setChurnNotes] = useState('')
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [selectedCompanyForOnboard, setSelectedCompanyForOnboard] = useState('')
  const [onboardFee, setOnboardFee] = useState('')
  const [onboardDate, setOnboardDate] = useState(new Date().toISOString().split('T')[0])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/companies')
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch {
      toast.error('Chyba při načítání dat')
    } finally {
      setLoading(false)
    }
  }

  // Alphabetical sort with group_name priority (same as dashboard)
  const filtered = useMemo(() => {
    let list = companies
    if (filter !== 'all') {
      list = list.filter(c => c.status === filter)
    }
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(s) ||
        c.ico.includes(s) ||
        (c.group_name || '').toLowerCase().includes(s)
      )
    }
    return list.sort((a, b) => {
      const aKey = (a.group_name || a.name).toLowerCase()
      const bKey = (b.group_name || b.name).toLowerCase()
      if (aKey !== bKey) return aKey.localeCompare(bKey, 'cs')
      return a.name.localeCompare(b.name, 'cs')
    })
  }, [companies, filter, search])

  const totalMRR = useMemo(() =>
    companies.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.billing_settings?.monthly_fee || 0), 0),
    [companies]
  )

  async function saveFee(companyId: string) {
    const fee = Number(editFee)
    if (isNaN(fee) || fee < 0) {
      toast.error('Zadejte platnou částku')
      return
    }

    const company = companies.find(c => c.id === companyId)
    const previousFee = company?.billing_settings?.monthly_fee || 0

    try {
      const res = await fetch(`/api/accountant/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_settings: {
            ...(company?.billing_settings || {}),
            monthly_fee: fee,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed')

      if (previousFee !== fee && previousFee > 0) {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            event_type: 'fee_changed',
            event_date: new Date().toISOString().split('T')[0],
            monthly_fee: fee,
            previous_fee: previousFee,
          }),
        })
      }

      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? { ...c, billing_settings: { ...(c.billing_settings || {}), monthly_fee: fee } }
          : c
      ))
      setEditingId(null)
      toast.success('Paušál uložen')
    } catch {
      toast.error('Chyba při ukládání')
    }
  }

  async function handleChurn(companyId: string) {
    const company = companies.find(c => c.id === companyId)
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          event_type: 'churned',
          event_date: new Date().toISOString().split('T')[0],
          monthly_fee: company?.billing_settings?.monthly_fee || 0,
          notes: churnNotes || null,
        }),
      })

      setCompanies(prev => prev.map(c =>
        c.id === companyId ? { ...c, status: 'churned' } : c
      ))
      setShowChurnModal(null)
      setChurnNotes('')
      toast.success('Odchod klienta zaznamenán')
    } catch {
      toast.error('Chyba')
    }
  }

  async function handleOnboard() {
    if (!selectedCompanyForOnboard || !onboardFee) {
      toast.error('Vyplňte všechna pole')
      return
    }

    const company = companies.find(c => c.id === selectedCompanyForOnboard)
    const fee = Number(onboardFee)

    try {
      await fetch(`/api/accountant/companies/${selectedCompanyForOnboard}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_settings: {
            ...(company?.billing_settings || {}),
            monthly_fee: fee,
            client_since: onboardDate,
          },
          status: 'active',
        }),
      })

      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompanyForOnboard,
          event_type: 'onboarded',
          event_date: onboardDate,
          monthly_fee: fee,
        }),
      })

      setCompanies(prev => prev.map(c =>
        c.id === selectedCompanyForOnboard
          ? { ...c, status: 'active', billing_settings: { ...(c.billing_settings || {}), monthly_fee: fee, client_since: onboardDate } }
          : c
      ))

      setShowOnboardModal(false)
      setSelectedCompanyForOnboard('')
      setOnboardFee('')
      toast.success('Nový klient zaznamenán')
    } catch {
      toast.error('Chyba')
    }
  }

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: companies.length }
    companies.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return counts
  }, [companies])

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accountant/analytics" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Přehled klientů a paušálů</h1>
            <p className="text-sm text-gray-500">Kolik nám který klient měsíčně platí</p>
          </div>
        </div>
        <Button onClick={() => setShowOnboardModal(true)} className="gap-1">
          <UserPlus className="h-4 w-4" /> Nový klient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat dle názvu, IČO nebo skupiny..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'churned', 'paused', 'onboarding'] as FilterStatus[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Vše' : STATUS_LABELS[f]} ({filterCounts[f] || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{filtered.length} klientů</span>
        <span>|</span>
        <span className="font-semibold text-gray-900 dark:text-white">Měsíční příjem celkem: {formatCurrency(totalMRR)}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <Card className="rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">IČO</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Stav</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Měsíční paušál</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">Akce</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, index) => {
                  const fee = c.billing_settings?.monthly_fee || 0
                  const isEditing = editingId === c.id
                  const prevCompany = index > 0 ? filtered[index - 1] : null
                  const currentGroup = c.group_name || null
                  const prevGroup = prevCompany?.group_name || null
                  const showGroupHeader = currentGroup && currentGroup !== prevGroup
                  const isCollapsed = currentGroup ? collapsedGroups.has(currentGroup) : false

                  if (currentGroup && isCollapsed && !showGroupHeader) return null

                  return (
                    <Fragment key={c.id}>
                      {showGroupHeader && (
                        <tr
                          className="bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          onClick={() => toggleGroup(currentGroup!)}
                        >
                          <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 select-none">
                            <span className="inline-flex items-center gap-1">
                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                              {currentGroup}
                            </span>
                          </td>
                        </tr>
                      )}
                      {!isCollapsed && (
                        <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <Link href={`/accountant/clients/${c.id}/profile`} className="font-medium text-gray-900 dark:text-white hover:text-purple-600 transition-colors">
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.ico}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABELS[c.status] || c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  value={editFee}
                                  onChange={e => setEditFee(e.target.value)}
                                  className="w-28 text-right text-sm"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveFee(c.id)
                                    if (e.key === 'Escape') setEditingId(null)
                                  }}
                                />
                                <Button size="sm" variant="ghost" onClick={() => saveFee(c.id)} title="Uložit">
                                  <Save className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} title="Zrušit">
                                  <X className="h-3.5 w-3.5 text-gray-400" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`font-semibold cursor-pointer hover:text-purple-600 transition-colors ${fee > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                                onClick={() => { setEditingId(c.id); setEditFee(String(fee || '')) }}
                                title="Klikněte pro úpravu paušálu"
                              >
                                {fee > 0 ? formatCurrency(fee) : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.status === 'active' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowChurnModal(c.id)}
                                title="Zneaktivnit klienta"
                                className="text-red-500 hover:text-red-600"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Žádné výsledky
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Churn modal */}
      {showChurnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowChurnModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              Zaznamenat odchod klienta
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Klient: <strong>{companies.find(c => c.id === showChurnModal)?.name}</strong>
            </p>
            <textarea
              value={churnNotes}
              onChange={e => setChurnNotes(e.target.value)}
              placeholder="Důvod odchodu (volitelné)..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowChurnModal(null)}>Zrušit</Button>
              <Button variant="destructive" onClick={() => handleChurn(showChurnModal)}>
                Potvrdit odchod
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowOnboardModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Zaznamenat nového klienta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Firma</label>
                <select
                  value={selectedCompanyForOnboard}
                  onChange={e => setSelectedCompanyForOnboard(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">Vyberte firmu...</option>
                  {companies
                    .filter(c => c.status !== 'active' || !(c.billing_settings?.monthly_fee))
                    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.ico})</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Měsíční paušál (Kč)</label>
                <Input
                  type="number"
                  value={onboardFee}
                  onChange={e => setOnboardFee(e.target.value)}
                  placeholder="např. 8000"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Klientem od</label>
                <Input
                  type="date"
                  value={onboardDate}
                  onChange={e => setOnboardDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowOnboardModal(false)}>Zrušit</Button>
              <Button onClick={handleOnboard}>Zaznamenat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
