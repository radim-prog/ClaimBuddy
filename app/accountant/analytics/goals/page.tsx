'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Target, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface RevenueGoal {
  id: string
  year: number
  annual_revenue_target: number
  notes: string | null
}

export default function GoalsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [goal, setGoal] = useState<RevenueGoal | null>(null)
  const [annualTarget, setAnnualTarget] = useState('')
  const [notes, setNotes] = useState('')
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
      } else {
        setGoal(null)
        setAnnualTarget('')
        setNotes('')
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
      const res = await fetch('/api/analytics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          annual_revenue_target: Number(annualTarget),
          monthly_targets: {},
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

  const monthlyAmount = Number(annualTarget) > 0 ? Math.round(Number(annualTarget) / 12) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accountant/analytics" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Rocni cil obratu</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kolik chcete letos vydelat? System pak porovna se skutecnosti.</p>
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
        <div className="max-w-lg">
          <Card className="rounded-xl shadow-soft">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold font-display">Cilovy obrat na rok {year}</h3>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Kolik chcete za rok vydelat celkem (Kc)
                </label>
                <Input
                  type="number"
                  value={annualTarget}
                  onChange={e => setAnnualTarget(e.target.value)}
                  placeholder="napr. 3000000"
                  className="text-lg font-semibold"
                />
                {monthlyAmount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    To je priblizne <strong>{monthlyAmount.toLocaleString('cs')} Kc mesicne</strong> na pausalech.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Poznamky (volitelne)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  placeholder="Napr. proc jste zvolili tuto castku, jake jsou predpoklady..."
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Ukladam...' : 'Ulozit cil'}
              </Button>

              {goal && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  Naposledy upraveno: {goal.id ? 'ulozeno' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
