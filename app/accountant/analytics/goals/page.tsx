'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Target, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const MONTHS = ['Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven', 'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec']

interface RevenueGoal {
  id: string
  year: number
  annual_revenue_target: number
  monthly_targets: Record<string, number>
  notes: string | null
}

export default function GoalsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [goal, setGoal] = useState<RevenueGoal | null>(null)
  const [annualTarget, setAnnualTarget] = useState('')
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [useCustomMonths, setUseCustomMonths] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoal()
  }, [year])

  async function fetchGoal() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/goals?year=${year}`)
      const data = await res.json()
      if (data.goal) {
        setGoal(data.goal)
        setAnnualTarget(String(data.goal.annual_revenue_target))
        setNotes(data.goal.notes || '')
        const mt = data.goal.monthly_targets || {}
        setMonthlyTargets(
          Object.fromEntries(
            Object.entries(mt).map(([k, v]) => [k, String(v)])
          )
        )
        setUseCustomMonths(Object.keys(mt).length > 0)
      } else {
        setGoal(null)
        setAnnualTarget('')
        setMonthlyTargets({})
        setNotes('')
        setUseCustomMonths(false)
      }
    } catch {
      toast.error('Chyba pri nacitani cile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!annualTarget || Number(annualTarget) <= 0) {
      toast.error('Zadejte platny rocni cil')
      return
    }

    setSaving(true)
    try {
      const mt: Record<string, number> = {}
      if (useCustomMonths) {
        for (let m = 1; m <= 12; m++) {
          const key = String(m).padStart(2, '0')
          const val = monthlyTargets[key]
          if (val && Number(val) > 0) {
            mt[key] = Number(val)
          }
        }
      }

      const res = await fetch('/api/analytics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          annual_revenue_target: Number(annualTarget),
          monthly_targets: mt,
          notes: notes || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setGoal(data.goal)
      toast.success('Cil ulozen')
    } catch {
      toast.error('Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  function distributeEvenly() {
    const total = Number(annualTarget)
    if (!total || total <= 0) return
    const perMonth = Math.round(total / 12)
    const newTargets: Record<string, string> = {}
    for (let m = 1; m <= 12; m++) {
      newTargets[String(m).padStart(2, '0')] = String(perMonth)
    }
    setMonthlyTargets(newTargets)
  }

  const evenMonthly = Number(annualTarget) > 0 ? Math.round(Number(annualTarget) / 12) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accountant/analytics" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Nastaveni cilu</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Definujte rocni a mesicni cile obratu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>&larr; {year - 1}</Button>
          <span className="text-lg font-bold px-3">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>{year + 1} &rarr;</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Annual target */}
          <Card className="rounded-xl shadow-soft">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold font-display">Rocni cil</h3>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Cilovy rocni obrat (Kc)
                </label>
                <Input
                  type="number"
                  value={annualTarget}
                  onChange={e => setAnnualTarget(e.target.value)}
                  placeholder="napr. 3000000"
                  className="text-lg font-semibold"
                />
                {Number(annualTarget) > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    = {evenMonthly.toLocaleString('cs')} Kc/mesic (rovnomerne)
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Poznamky</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  placeholder="Volitelne poznamky k cili..."
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Ukladam...' : 'Ulozit cil'}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly targets */}
          <Card className="rounded-xl shadow-soft">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-display">Mesicni cile</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useCustomMonths}
                      onChange={e => setUseCustomMonths(e.target.checked)}
                      className="rounded"
                    />
                    Vlastni per mesic
                  </label>
                  {useCustomMonths && (
                    <Button variant="ghost" size="sm" onClick={distributeEvenly} title="Rozlozit rovnomerne">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MONTHS.map((name, i) => {
                  const key = String(i + 1).padStart(2, '0')
                  const value = useCustomMonths ? (monthlyTargets[key] || '') : String(evenMonthly)
                  return (
                    <div key={key}>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{name}</label>
                      <Input
                        type="number"
                        value={value}
                        onChange={e => {
                          if (!useCustomMonths) return
                          setMonthlyTargets(prev => ({ ...prev, [key]: e.target.value }))
                        }}
                        disabled={!useCustomMonths}
                        className="text-sm"
                        placeholder="0"
                      />
                    </div>
                  )
                })}
              </div>

              {useCustomMonths && (
                <div className="pt-2 border-t text-sm text-gray-500">
                  Soucet: {Object.values(monthlyTargets).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString('cs')} Kc
                  {Number(annualTarget) > 0 && (
                    <span className="ml-2">
                      (z {Number(annualTarget).toLocaleString('cs')} Kc)
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
