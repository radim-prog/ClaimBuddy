'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type TimeEntry = {
  id: string
  date: string
  hours: number
  minutes: number
  description: string
  task_title?: string
  billable: boolean
  in_tariff: boolean
  hourly_rate: number
  user_name?: string
  created_at: string
}

type QuickTimeLogProps = {
  companyId: string
  companyName: string
  onTimeLogged?: () => void
}

const QUICK_TIMES = [
  { label: '0:15', minutes: 15 },
  { label: '0:30', minutes: 30 },
  { label: '1:00', minutes: 60 },
  { label: '1:30', minutes: 90 },
  { label: '2:00', minutes: 120 },
  { label: '3:00', minutes: 180 },
]

const DATE_OPTIONS = [
  { label: 'Dnes', value: () => new Date().toISOString().split('T')[0] },
  { label: 'Včera', value: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] } },
  { label: 'Předevčírem', value: () => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0] } },
]

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hod`
  return `${h}h ${m}m`
}

export function QuickTimeLog({ companyId, companyName, onTimeLogged }: QuickTimeLogProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].value())
  const [selectedMinutes, setSelectedMinutes] = useState(0)
  const [customMinutes, setCustomMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [inTariff, setInTariff] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [prepaidProjectId, setPrepaidProjectId] = useState<string | null>(null)
  const [prepaidProjects, setPrepaidProjects] = useState<Array<{ id: string; title: string; status: string }>>([])

  // Current period
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/time-entries?company_id=${companyId}&period=${currentPeriod}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [companyId, currentPeriod])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Fetch active prepaid projects for this company
  useEffect(() => {
    fetch(`/api/prepaid-projects?company_id=${companyId}&status=active,sent`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.projects) setPrepaidProjects(data.projects) })
      .catch(() => {})
  }, [companyId])

  // Calculate summary
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || Math.round((e.hours || 0) * 60)), 0)
  const billableMinutes = entries.filter(e => e.billable && !e.in_tariff).reduce((sum, e) => sum + (e.minutes || Math.round((e.hours || 0) * 60)), 0)
  const billableAmount = entries.filter(e => e.billable && !e.in_tariff).reduce((sum, e) => {
    const mins = e.minutes || Math.round((e.hours || 0) * 60)
    return sum + (mins / 60) * (e.hourly_rate || 700)
  }, 0)

  const handleSave = async () => {
    const mins = selectedMinutes || parseInt(customMinutes) || 0
    if (mins <= 0) {
      toast.error('Zadejte čas')
      return
    }
    if (!description.trim()) {
      toast.error('Zadejte popis práce')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          company_name: companyName,
          date: selectedDate,
          minutes: mins,
          description: description.trim(),
          billable: !inTariff,
          in_tariff: inTariff,
          prepaid_project_id: prepaidProjectId,
        }),
      })

      if (res.ok) {
        toast.success(`Zalogováno ${formatMinutes(mins)}`)
        setDescription('')
        setSelectedMinutes(0)
        setCustomMinutes('')
        setShowForm(false)
        fetchEntries()
        if (prepaidProjectId) onTimeLogged?.()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat záznam?')) return
    try {
      const res = await fetch(`/api/time-entries?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Záznam smazán')
        fetchEntries()
      }
    } catch {
      toast.error('Chyba při mazání')
    }
  }

  const monthName = now.toLocaleDateString('cs-CZ', { month: 'long' })

  return (
    <div className="space-y-4">
      {/* Compact summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {monthName}: <span className="font-semibold text-gray-900 dark:text-white">{formatMinutes(totalMinutes)}</span>
          </span>
          {billableAmount > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">{Math.round(billableAmount).toLocaleString('cs-CZ')} Kč</span> k fakturaci
            </span>
          )}
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'secondary' : 'default'}
          className={showForm ? '' : 'bg-purple-600 hover:bg-purple-700'}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Zavřít' : 'Zalogovat'}
        </Button>
      </div>

      {/* Quick Log Form */}
      {showForm && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 space-y-3">
            {/* Date selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Datum:</span>
              <div className="flex gap-1">
                {DATE_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedDate(opt.value())}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedDate === opt.value()
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Time quick-pick */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Čas:</span>
              <div className="flex gap-1 flex-wrap">
                {QUICK_TIMES.map(t => (
                  <button
                    key={t.minutes}
                    onClick={() => { setSelectedMinutes(t.minutes); setCustomMinutes('') }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedMinutes === t.minutes
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <Input
                  type="number"
                  placeholder="min"
                  value={customMinutes}
                  onChange={(e) => { setCustomMinutes(e.target.value); setSelectedMinutes(0) }}
                  className="w-16 h-7 text-xs"
                  min={1}
                  max={480}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0 pt-1.5">Popis:</span>
              <Input
                placeholder="Co jste dělali..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            {/* Tariff toggle + Save */}
            {/* Prepaid project selector */}
            {prepaidProjects.length > 0 && (
              <div className="pt-1">
                <select
                  value={prepaidProjectId || ''}
                  onChange={e => setPrepaidProjectId(e.target.value || null)}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Bez prepaid projektu</option>
                  {prepaidProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInTariff(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    !inTariff
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  K fakturaci
                </button>
                <button
                  onClick={() => setInTariff(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    inTariff
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  V tarifu
                </button>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
                Uložit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      {!loading && entries.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Záznamy za {monthName} ({entries.length})
          </h4>
          {entries.slice(0, 10).map(entry => {
            const mins = entry.minutes || Math.round((entry.hours || 0) * 60)
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 group text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-400 dark:text-gray-500 text-xs w-16 shrink-0">
                    {new Date(entry.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                  </span>
                  {entry.user_name && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0 truncate" title={entry.user_name}>
                      {entry.user_name}
                    </span>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white w-12 shrink-0">
                    {formatMinutes(mins)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {entry.description}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {entry.in_tariff ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500 dark:text-gray-400">tarif</Badge>
                  ) : entry.billable ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                      {Math.round((mins / 60) * (entry.hourly_rate || 700))} Kč
                    </Badge>
                  ) : null}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
          {entries.length > 10 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-2">
              ...a dalších {entries.length - 10} záznamů
            </p>
          )}
        </div>
      )}

      {!loading && entries.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Žádné záznamy za {monthName}
        </p>
      )}
    </div>
  )
}
